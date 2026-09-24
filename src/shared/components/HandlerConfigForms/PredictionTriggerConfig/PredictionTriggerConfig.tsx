import i18n from '@dhis2/d2-i18n'
import { CircularLoader, InputField } from '@dhis2/ui'
import React, { useEffect } from 'react'
import { useFormContext } from 'react-hook-form'
import { get, set } from '../configHelpers'
import { ChapSetupNotice } from '@/shared/components/HandlerConfigForms/PredictionTriggerConfig/ChapSetupNotice'
import { EvaluationSelector } from '@/shared/components/HandlerConfigForms/PredictionTriggerConfig/EvaluationSelector'
import { useSelectedEvaluation } from '@/shared/components/HandlerConfigForms/PredictionTriggerConfig/hooks/useSelectedEvaluation'
import { PredictionSetupSummary } from '@/shared/components/HandlerConfigForms/PredictionTriggerConfig/PredictionSetupSummary'
import { TrainingPeriodFields } from '@/shared/components/HandlerConfigForms/PredictionTriggerConfig/TrainingPeriodFields'
import {
    FormSection,
    formSectionGrids,
} from '@/shared/components/ui/FormPrimitives'

export interface PredictionTriggerConfigProps {
    value: Record<string, unknown> | null
    onChange: (v: Record<string, unknown>) => void
}

export function PredictionTriggerConfig({
    value,
    onChange,
}: PredictionTriggerConfigProps): React.ReactElement {
    const { setValue, trigger } = useFormContext()
    const {
        evaluation,
        evaluations,
        setup,
        loading,
        error,
        setupLoading,
        missingSetup,
        refresh,
    } = useSelectedEvaluation()

    const name = get(value, 'name')

    useEffect(() => {
        if (setup && !name) {
            setValue('handlerConfig.name', setup.name, { shouldDirty: true })
            void trigger('handlerConfig')
        }
    }, [setup?.id])

    useEffect(() => {
        if (evaluation?.predictionSetupId) {
            setValue(
                'handlerConfig.predictionSetupId',
                evaluation.predictionSetupId,
                { shouldDirty: true, shouldValidate: true }
            )
        }
    }, [evaluation?.predictionSetupId])

    const noEvaluations = !loading && evaluations.length === 0

    return (
        <>
            <EvaluationSelector
                evaluations={evaluations}
                loading={loading}
                error={error}
            />

            {noEvaluations && (
                <ChapSetupNotice
                    title={i18n.t('No evaluations found')}
                    message={i18n.t(
                        'Evaluate a model in CHAP first, then create a prediction setup from that evaluation.'
                    )}
                    onRefresh={refresh}
                />
            )}

            {missingSetup && (
                <ChapSetupNotice
                    warning
                    title={i18n.t('This evaluation has no prediction setup')}
                    message={i18n.t(
                        'Create a prediction setup from this evaluation in CHAP, then refresh. The setup supplies the model, org units and covariates this step runs with.'
                    )}
                    onRefresh={refresh}
                />
            )}

            {setupLoading && <CircularLoader small />}

            {setup && (
                <>
                    <div className={formSectionGrids.grid2}>
                        <InputField
                            label={i18n.t('Prediction setup name')}
                            helpText={i18n.t('Name of the prediction setup.')}
                            value={setup.name}
                            disabled
                            onChange={() => undefined}
                        />
                        <InputField
                            label={i18n.t('Job name')}
                            required
                            helpText={i18n.t('Identifies the job in CHAP.')}
                            value={name}
                            onChange={({ value: v }) =>
                                onChange(set(value, 'name', v))
                            }
                        />
                    </div>

                    <FormSection title={i18n.t('Training period')} tight>
                        <TrainingPeriodFields setup={setup} />
                    </FormSection>

                    <PredictionSetupSummary setup={setup} />
                </>
            )}
        </>
    )
}
