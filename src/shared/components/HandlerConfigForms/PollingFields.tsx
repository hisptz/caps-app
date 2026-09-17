import i18n from '@dhis2/d2-i18n'
import { InputField } from '@dhis2/ui'
import React from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import type { PipelineStepFormWithHandlerValues } from '@/modules/pipeline-detail/schemas/stepFormSchema'
import { formSectionGrids } from '@/shared/components/ui/FormPrimitives'

export function PollingFields(): React.ReactElement {
    const { control } = useFormContext<PipelineStepFormWithHandlerValues>()

    return (
        <div className={formSectionGrids.grid2}>
            <Controller
                name="handlerConfig.polling.pollIntervalMs"
                control={control}
                render={({ field, fieldState }) => (
                    <InputField
                        label={i18n.t('Poll interval (ms)')}
                        type="number"
                        required
                        helpText={i18n.t(
                            'Time between status checks. Minimum 250ms.'
                        )}
                        value={
                            typeof field.value === 'number' &&
                            Number.isFinite(field.value)
                                ? String(field.value)
                                : ''
                        }
                        onChange={({ value: v }) => {
                            const raw = v ?? ''
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
                name="handlerConfig.polling.maxAttempts"
                control={control}
                render={({ field, fieldState }) => (
                    <InputField
                        label={i18n.t('Max attempts')}
                        type="number"
                        required
                        helpText={i18n.t(
                            'Maximum number of polling attempts before the step fails.'
                        )}
                        value={
                            typeof field.value === 'number' &&
                            Number.isFinite(field.value)
                                ? String(field.value)
                                : ''
                        }
                        onChange={({ value: v }) => {
                            const raw = v ?? ''
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
    )
}
