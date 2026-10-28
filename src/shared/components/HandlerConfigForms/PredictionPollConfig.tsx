import i18n from '@dhis2/d2-i18n'
import { InputField } from '@dhis2/ui'
import React, { useEffect, useMemo } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import type { PipelineStepFormWithHandlerValues } from '@/modules/pipeline-detail/schemas/stepFormSchema'
import {
    defaultPredictionPollConfig,
    isPredictionPollConfig,
} from '@/modules/prediction-poll/schemas/config'
import {
    FormSection,
    formSectionGrids,
} from '@/shared/components/ui/FormPrimitives'

export interface PredictionPollConfigProps {
    value: Record<string, unknown> | null
    onChange: (value: Record<string, unknown>) => void
}

export function PredictionPollConfig({
    value,
    onChange,
}: PredictionPollConfigProps): React.ReactElement {
    const { control, getValues, setValue } =
        useFormContext<PipelineStepFormWithHandlerValues>()
    const defaults = useMemo(() => defaultPredictionPollConfig(), [])

    useEffect(() => {
        const current = getValues('handlerConfig') ?? value
        if (!isPredictionPollConfig(current)) {
            setValue('handlerConfig', defaults, { shouldDirty: false })
            onChange(defaults)
        }
    }, [defaults, getValues, onChange, setValue, value])

    return (
        <FormSection
            title={i18n.t('Prediction polling')}
            description={i18n.t(
                'Control how often CAPS checks the prediction job and when it times out.'
            )}
            tight
        >
            <div className={formSectionGrids.grid2}>
                <Controller
                    name="handlerConfig.polling.intervalSeconds"
                    control={control}
                    render={({ field, fieldState }) => (
                        <InputField
                            label={i18n.t('Poll interval (seconds)')}
                            type="number"
                            min="5"
                            max="3600"
                            step="1"
                            required
                            helpText={i18n.t(
                                'Time between prediction job status checks (5–3600 seconds).'
                            )}
                            value={
                                typeof field.value === 'number' &&
                                Number.isFinite(field.value)
                                    ? String(field.value)
                                    : String(defaults.polling.intervalSeconds)
                            }
                            onChange={({ value: next }) => {
                                const raw = next ?? ''
                                const parsed = Number(raw)
                                field.onChange(
                                    raw === '' || !Number.isFinite(parsed)
                                        ? undefined
                                        : parsed
                                )
                            }}
                            onBlur={field.onBlur}
                            error={Boolean(fieldState.error)}
                            validationText={fieldState.error?.message}
                        />
                    )}
                />
                <Controller
                    name="handlerConfig.polling.timeoutHours"
                    control={control}
                    render={({ field, fieldState }) => (
                        <InputField
                            label={i18n.t('Timeout (hours)')}
                            type="number"
                            min="0.25"
                            max="72"
                            step="0.25"
                            required
                            helpText={i18n.t(
                                'Maximum time to wait for the prediction job (0.25–72 hours).'
                            )}
                            value={
                                typeof field.value === 'number' &&
                                Number.isFinite(field.value)
                                    ? String(field.value)
                                    : String(defaults.polling.timeoutHours)
                            }
                            onChange={({ value: next }) => {
                                const raw = next ?? ''
                                const parsed = Number(raw)
                                field.onChange(
                                    raw === '' || !Number.isFinite(parsed)
                                        ? undefined
                                        : parsed
                                )
                            }}
                            onBlur={field.onBlur}
                            error={Boolean(fieldState.error)}
                            validationText={fieldState.error?.message}
                        />
                    )}
                />
            </div>
        </FormSection>
    )
}
