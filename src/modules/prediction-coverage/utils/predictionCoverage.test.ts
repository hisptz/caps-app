import {
    checkPredictionCoverage,
    getPipelinePredictionSetupId,
    hasCoverageIssues,
} from './predictionCoverage'
import type { PipelineStep, PredictionSetup } from '@/shared/types/caps'

function step(
    id: string,
    stepOrder: number,
    {
        handlerKey,
        handlerConfig = null,
    }: {
        handlerKey: string
        handlerConfig?: Record<string, unknown> | null
    }
): PipelineStep {
    return {
        id,
        pipelineId: 'p1',
        name: id,
        description: null,
        handlerKey,
        stepOrder,
        maxRetries: 3,
        retryDelayMs: 1000,
        inputSchema: null,
        handlerConfig,
    }
}

const download = (
    id: string,
    order: number,
    {
        dataElement,
        periodType = 'daily',
    }: { dataElement: string; periodType?: string }
) =>
    step(id, order, {
        handlerKey: 'climate-openeo-create',
        handlerConfig: { variable: { dataElement }, period: { periodType } },
    })
const analytics = (id: string, order: number, skipAggregate = false) =>
    step(id, order, {
        handlerKey: 'dhis2-analytics-run',
        handlerConfig: { runOptions: { skipAggregate } },
    })
const predict = (id: string, order: number, predictionSetupId = 7) =>
    step(id, order, {
        handlerKey: 'prediction-trigger',
        handlerConfig: { predictionSetupId },
    })

const setup: PredictionSetup = {
    id: 7,
    name: 'Malaria monthly',
    created: null,
    backtestId: 1,
    configuredModel: { id: 1, name: 'ewars' },
    startPeriod: '202001',
    orgUnits: ['ou1'],
    covariateSources: [
        { covariate: 'rainfall', dataElementId: 'deRain' },
        { covariate: 'mean_temperature', dataElementId: 'deTemp' },
        { covariate: 'disease_cases', dataElementId: 'deCases' },
    ],
    periodType: 'month',
    scheduleCronExpression: null,
    scheduleEnabled: false,
    quantileTargets: [],
}

describe('getPipelinePredictionSetupId', () => {
    it('reads the setup id from the first prediction step in order', () => {
        expect(
            getPipelinePredictionSetupId([
                predict('late', 5, 9),
                download('rain', 0, { dataElement: 'deRain' }),
                predict('early', 2, 7),
            ])
        ).toBe(7)
    })

    it('is undefined when no prediction step has a setup yet', () => {
        expect(
            getPipelinePredictionSetupId([
                step('p', 0, {
                    handlerKey: 'prediction-trigger',
                    handlerConfig: {},
                }),
            ])
        ).toBeUndefined()
    })
})

describe('checkPredictionCoverage', () => {
    it('reports nothing for a well-formed pipeline', () => {
        const coverage = checkPredictionCoverage(
            [
                download('rain', 0, { dataElement: 'deRain' }),
                download('temp', 1, { dataElement: 'deTemp' }),
                analytics('analytics', 2),
                predict('predict', 3),
            ],
            setup
        )
        expect(coverage && hasCoverageIssues(coverage)).toBe(false)
        expect(
            coverage?.covariates.map((c) => [
                c.source.covariate,
                c.producers.map((p) => p.id),
            ])
        ).toEqual([
            ['rainfall', ['rain']],
            ['mean_temperature', ['temp']],
            ['disease_cases', []],
        ])
    })

    it('flags a download written to a data element the setup does not read', () => {
        const coverage = checkPredictionCoverage(
            [
                download('rain', 0, { dataElement: 'deOtherRain' }),
                download('temp', 1, { dataElement: 'deTemp' }),
                analytics('analytics', 2),
                predict('predict', 3),
            ],
            setup
        )
        expect(coverage?.unmatchedDownloads.map((s) => s.id)).toEqual(['rain'])
        expect(coverage?.covariates[0].producers).toEqual([])
    })

    it('flags covariate downloads that run after the prediction', () => {
        const coverage = checkPredictionCoverage(
            [
                download('temp', 0, { dataElement: 'deTemp' }),
                analytics('analytics', 1),
                predict('predict', 2),
                download('rain', 3, { dataElement: 'deRain' }),
            ],
            setup
        )
        expect(coverage?.lateDownloads.map((s) => s.id)).toEqual(['rain'])
    })

    it('requires an aggregate analytics run after the last covariate download', () => {
        const before = checkPredictionCoverage(
            [
                analytics('analytics', 0),
                download('rain', 1, { dataElement: 'deRain' }),
                predict('predict', 2),
            ],
            setup
        )
        expect(before?.missingAnalyticsRun).toBe(true)

        const skipped = checkPredictionCoverage(
            [
                download('rain', 0, { dataElement: 'deRain' }),
                analytics('analytics', 1, true),
                predict('predict', 2),
            ],
            setup
        )
        expect(skipped?.missingAnalyticsRun).toBe(true)
    })

    it('does not ask for analytics when nothing is downloaded for the setup', () => {
        const coverage = checkPredictionCoverage([predict('predict', 0)], setup)
        expect(coverage?.missingAnalyticsRun).toBe(false)
    })

    it('flags downloads coarser than the setup period but not finer ones', () => {
        const coverage = checkPredictionCoverage(
            [
                download('rain', 0, {
                    dataElement: 'deRain',
                    periodType: 'daily',
                }),
                download('temp', 1, {
                    dataElement: 'deTemp',
                    periodType: 'monthly',
                }),
                analytics('analytics', 2),
                predict('predict', 3),
            ],
            { ...setup, periodType: 'week' }
        )
        expect(
            coverage?.coarsePeriods.map((c) => [c.step.id, c.periodType])
        ).toEqual([['temp', 'monthly']])
    })

    it('returns null when no step runs this setup', () => {
        expect(
            checkPredictionCoverage([predict('predict', 0, 99)], setup)
        ).toBeNull()
    })
})
