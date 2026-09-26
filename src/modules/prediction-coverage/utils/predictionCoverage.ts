import type {
    CovariateSource,
    PipelineStep,
    PredictionSetup,
} from '@/shared/types/caps'

export const PREDICTION_TRIGGER_HANDLER = 'prediction-trigger'
export const CLIMATE_OPENEO_CREATE_HANDLER = 'climate-openeo-create'
export const DHIS2_ANALYTICS_RUN_HANDLER = 'dhis2-analytics-run'

const byOrder = (a: PipelineStep, b: PipelineStep) => a.stepOrder - b.stepOrder

/** The CHAP prediction setup the pipeline's first prediction step runs, if one is picked. */
export function getPipelinePredictionSetupId(
    steps: PipelineStep[]
): number | undefined {
    for (const step of [...steps].sort(byOrder)) {
        if (step.handlerKey !== PREDICTION_TRIGGER_HANDLER) {
            continue
        }
        const id = step.handlerConfig?.predictionSetupId
        if (typeof id === 'number') {
            return id
        }
    }
    return undefined
}

function readDataElement(step: PipelineStep): string | null {
    const variable = step.handlerConfig?.variable
    if (typeof variable !== 'object' || variable === null) {
        return null
    }
    const id = (variable as Record<string, unknown>).dataElement
    return typeof id === 'string' && id.length > 0 ? id : null
}

type Granularity = 'daily' | 'weekly' | 'monthly'

const GRANULARITY_RANK: Record<Granularity, number> = {
    daily: 0,
    weekly: 1,
    monthly: 2,
}

function toGranularity(periodType: unknown): Granularity | null {
    if (typeof periodType !== 'string') {
        return null
    }
    switch (periodType.toLowerCase()) {
        case 'day':
        case 'daily':
            return 'daily'
        case 'week':
        case 'weekly':
            return 'weekly'
        case 'month':
        case 'monthly':
            return 'monthly'
        default:
            return null
    }
}

function readPeriodType(step: PipelineStep): Granularity | null {
    const period = step.handlerConfig?.period
    if (typeof period !== 'object' || period === null) {
        return null
    }
    return toGranularity((period as Record<string, unknown>).periodType)
}

/** An analytics run that actually rebuilds the aggregate tables the prediction reads. */
function refreshesAggregateAnalytics(step: PipelineStep): boolean {
    if (step.handlerKey !== DHIS2_ANALYTICS_RUN_HANDLER) {
        return false
    }
    const runOptions = step.handlerConfig?.runOptions
    return !(
        typeof runOptions === 'object' &&
        runOptions !== null &&
        (runOptions as Record<string, unknown>).skipAggregate === true
    )
}

export type CovariateCoverage = {
    source: CovariateSource
    /** Climate download steps that write this covariate's data element. */
    producers: PipelineStep[]
}

export type CoarsePeriodStep = {
    step: PipelineStep
    periodType: Granularity
}

export type PredictionCoverage = {
    predictionStep: PipelineStep
    covariates: CovariateCoverage[]
    /** Climate downloads writing a data element the setup never reads — usually an ID mismatch. */
    unmatchedDownloads: PipelineStep[]
    /** Covariate downloads ordered after the prediction step, so this run cannot use them. */
    lateDownloads: PipelineStep[]
    /** Covariate downloads run before the prediction with no aggregate analytics run between. */
    missingAnalyticsRun: boolean
    /** Covariate downloads whose period is coarser than the setup's, so analytics cannot split them. */
    coarsePeriods: CoarsePeriodStep[]
}

/**
 * Compares the pipeline's climate downloads with what its CHAP prediction setup reads from
 * DHIS2 analytics. The prediction step never looks at the other steps, so a download written to
 * the wrong data element still "succeeds" and the prediction runs on stale or missing data.
 */
export function checkPredictionCoverage(
    steps: PipelineStep[],
    setup: PredictionSetup
): PredictionCoverage | null {
    const ordered = [...steps].sort(byOrder)
    const predictionIndex = ordered.findIndex(
        (s) =>
            s.handlerKey === PREDICTION_TRIGGER_HANDLER &&
            s.handlerConfig?.predictionSetupId === setup.id
    )
    if (predictionIndex === -1) {
        return null
    }
    const predictionStep = ordered[predictionIndex]
    const covariateIds = new Set(
        setup.covariateSources.map((s) => s.dataElementId)
    )

    const downloads = ordered
        .map((step, index) => ({ step, index, de: readDataElement(step) }))
        .filter(
            (d): d is { step: PipelineStep; index: number; de: string } =>
                d.step.handlerKey === CLIMATE_OPENEO_CREATE_HANDLER &&
                d.de !== null
        )
    const covariateDownloads = downloads.filter((d) => covariateIds.has(d.de))
    const earlyDownloads = covariateDownloads.filter(
        (d) => d.index < predictionIndex
    )

    const lastEarlyIndex = Math.max(-1, ...earlyDownloads.map((d) => d.index))
    const missingAnalyticsRun =
        earlyDownloads.length > 0 &&
        !ordered
            .slice(lastEarlyIndex + 1, predictionIndex)
            .some(refreshesAggregateAnalytics)

    const setupGranularity = toGranularity(setup.periodType)
    const coarsePeriods: CoarsePeriodStep[] = []
    if (setupGranularity) {
        for (const { step } of covariateDownloads) {
            const periodType = readPeriodType(step)
            if (
                periodType &&
                GRANULARITY_RANK[periodType] >
                    GRANULARITY_RANK[setupGranularity]
            ) {
                coarsePeriods.push({ step, periodType })
            }
        }
    }

    return {
        predictionStep,
        covariates: setup.covariateSources.map((source) => ({
            source,
            producers: downloads
                .filter((d) => d.de === source.dataElementId)
                .map((d) => d.step),
        })),
        unmatchedDownloads: downloads
            .filter((d) => !covariateIds.has(d.de))
            .map((d) => d.step),
        lateDownloads: covariateDownloads
            .filter((d) => d.index > predictionIndex)
            .map((d) => d.step),
        missingAnalyticsRun,
        coarsePeriods,
    }
}

export function hasCoverageIssues(coverage: PredictionCoverage): boolean {
    return (
        coverage.unmatchedDownloads.length > 0 ||
        coverage.lateDownloads.length > 0 ||
        coverage.missingAnalyticsRun ||
        coverage.coarsePeriods.length > 0
    )
}
