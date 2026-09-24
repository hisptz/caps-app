import { useDataEngine } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import { CircularLoader, NoticeBox } from '@dhis2/ui'
import React from 'react'
import type { RunContextMode } from './HandlerContextForm'
import { TrainingPeriodFields } from '@/shared/components/HandlerConfigForms/PredictionTriggerConfig/TrainingPeriodFields'
import { FormSection } from '@/shared/components/ui/FormPrimitives'
import { usePredictionSetupQuery } from '@/shared/hooks/useEvaluationsQuery'

export interface PredictionTriggerContextFormProps {
    stepId: string
    handlerConfig?: Record<string, unknown> | null
    mode?: RunContextMode
}

export function PredictionTriggerContextForm({
    stepId,
    handlerConfig,
    mode = 'run',
}: PredictionTriggerContextFormProps): React.ReactElement {
    const engine = useDataEngine()
    const name = `stepContexts.${stepId}.period`
    const rawSetupId = handlerConfig?.predictionSetupId
    const setupId = typeof rawSetupId === 'number' ? rawSetupId : undefined
    const { data, isInitialLoading, isError } = usePredictionSetupQuery(
        engine,
        setupId
    )
    const setup = data?.setup ?? undefined

    function renderProblem(): React.ReactNode {
        if (setupId === undefined) {
            return (
                <NoticeBox
                    warning
                    title={i18n.t('This step has no prediction setup')}
                >
                    {i18n.t(
                        'Edit the prediction step and choose an evaluation with a prediction setup, then come back here.'
                    )}
                </NoticeBox>
            )
        }
        if (isError || data?.error) {
            return (
                <NoticeBox
                    error
                    title={i18n.t('Could not load the prediction setup')}
                >
                    {data?.error ??
                        i18n.t(
                            'CHAP could not be reached. Try again in a moment.'
                        )}
                </NoticeBox>
            )
        }
        if (data && !data.setup) {
            return (
                <NoticeBox warning title={i18n.t('Prediction setup not found')}>
                    {i18n.t(
                        'The prediction setup this step uses no longer exists in CHAP. Edit the step and choose another evaluation.'
                    )}
                </NoticeBox>
            )
        }
        return null
    }

    return (
        <FormSection title={i18n.t('Training period')} tight>
            {isInitialLoading && <CircularLoader small />}
            {!isInitialLoading && renderProblem()}
            {setup && (
                <TrainingPeriodFields
                    setup={setup}
                    name={name}
                    rolling={mode === 'schedule'}
                />
            )}
        </FormSection>
    )
}
