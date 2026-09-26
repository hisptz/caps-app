import { useDataEngine } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import { NoticeBox } from '@dhis2/ui'
import React, { useMemo } from 'react'
import {
    checkPredictionCoverage,
    getPipelinePredictionSetupId,
    hasCoverageIssues,
} from '@/modules/prediction-coverage/utils/predictionCoverage'
import { usePredictionSetupQuery } from '@/shared/hooks/useEvaluationsQuery'
import type { PipelineStep } from '@/shared/types/caps'

type Props = {
    steps: PipelineStep[]
}

const names = (steps: PipelineStep[]) => steps.map((s) => s.name).join(', ')

/**
 * Warns when the climate downloads do not feed what the pipeline's CHAP prediction setup
 * reads — wrong data element, wrong order, no analytics run, or a period too coarse — since
 * the prediction step would otherwise run on stale or missing data without failing.
 */
export function PredictionCoverageNotice({
    steps,
}: Props): React.ReactElement | null {
    const engine = useDataEngine()
    const setupId = useMemo(() => getPipelinePredictionSetupId(steps), [steps])
    const { data } = usePredictionSetupQuery(engine, setupId)
    const setup = data?.setup

    const coverage = useMemo(
        () => (setup ? checkPredictionCoverage(steps, setup) : null),
        [steps, setup]
    )
    if (!setup || !coverage || !hasCoverageIssues(coverage)) {
        return null
    }

    const notDownloaded = coverage.covariates
        .filter((c) => c.producers.length === 0)
        .map((c) => c.source.covariate)
    const opts = { interpolation: { escapeValue: false } }

    return (
        <div style={{ marginBottom: 16 }}>
            <NoticeBox
                warning
                title={i18n.t(
                    'Steps do not match prediction setup "{{name}}"',
                    { name: setup.name, ...opts }
                )}
            >
                <ul style={{ margin: 0, paddingInlineStart: 20 }}>
                    {coverage.unmatchedDownloads.length > 0 && (
                        <li>
                            {i18n.t(
                                'Written to a data element the setup does not read — {{steps}}. Pick the covariate in each step so it writes where "{{prediction}}" reads.',
                                {
                                    steps: names(coverage.unmatchedDownloads),
                                    prediction: coverage.predictionStep.name,
                                    ...opts,
                                }
                            )}
                            {notDownloaded.length > 0 &&
                                ' ' +
                                    i18n.t(
                                        'Covariates no step downloads: {{covariates}}.',
                                        {
                                            covariates:
                                                notDownloaded.join(', '),
                                            ...opts,
                                        }
                                    )}
                        </li>
                    )}
                    {coverage.lateDownloads.length > 0 && (
                        <li>
                            {i18n.t(
                                'Run after "{{prediction}}", so each prediction uses the previous run’s data — {{steps}}. Move them above it.',
                                {
                                    prediction: coverage.predictionStep.name,
                                    steps: names(coverage.lateDownloads),
                                    ...opts,
                                }
                            )}
                        </li>
                    )}
                    {coverage.missingAnalyticsRun && (
                        <li>
                            {i18n.t(
                                'No analytics run between the covariate downloads and "{{prediction}}". The prediction reads analytics, so new data is not seen until analytics runs. Add a DHIS2 analytics run step (without skipping aggregate tables) just above it.',
                                {
                                    prediction: coverage.predictionStep.name,
                                    ...opts,
                                }
                            )}
                        </li>
                    )}
                    {coverage.coarsePeriods.length > 0 && (
                        <li>
                            {i18n.t(
                                'Downloaded at a coarser period than the setup’s {{periodType}} periods, so analytics cannot split the values — {{steps}}.',
                                {
                                    periodType: setup.periodType,
                                    steps: coverage.coarsePeriods
                                        .map(
                                            (c) =>
                                                `${c.step.name} (${c.periodType})`
                                        )
                                        .join(', '),
                                    ...opts,
                                }
                            )}
                        </li>
                    )}
                </ul>
            </NoticeBox>
        </div>
    )
}
