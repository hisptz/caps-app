import i18n from '@dhis2/d2-i18n'
import { InputField, TextAreaField } from '@dhis2/ui'
import React from 'react'
import { Controller } from 'react-hook-form'
import {
    FormSection,
    formSectionGrids,
} from '@/shared/components/ui/FormPrimitives'

export function BasicsPanel(): React.ReactElement {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Controller
                name="name"
                render={({ field, fieldState }) => (
                    <InputField
                        label={i18n.t('Name')}
                        required
                        placeholder={i18n.t('e.g. Download ERA5 Data')}
                        value={field.value}
                        onChange={({ value }) => field.onChange(value ?? '')}
                        onBlur={field.onBlur}
                        error={Boolean(fieldState.error)}
                        validationText={fieldState.error?.message}
                    />
                )}
            />
            <Controller
                name="description"
                render={({ field, fieldState }) => (
                    <TextAreaField
                        label={i18n.t('Description')}
                        value={field.value ?? ''}
                        onChange={({ value }) => field.onChange(value ?? '')}
                        rows={2}
                        error={Boolean(fieldState.error)}
                        validationText={fieldState.error?.message}
                    />
                )}
            />
            <FormSection
                title={i18n.t('Reliability')}
                description={i18n.t('Retry policy and queue placement.')}
            >
                <ReliabilityFields />
            </FormSection>
        </div>
    )
}

function ReliabilityFields(): React.ReactElement {
    return (
        <div className={formSectionGrids.grid2}>
            <Controller
                name="maxRetries"
                render={({ field, fieldState }) => (
                    <InputField
                        label={i18n.t('Max retries')}
                        type="number"
                        value={
                            field.value === undefined ? '' : String(field.value)
                        }
                        onChange={({ value }) =>
                            field.onChange(
                                value === '' ? undefined : Number(value)
                            )
                        }
                        onBlur={field.onBlur}
                        helpText={i18n.t('Attempts after the first failure.')}
                        error={Boolean(fieldState.error)}
                        validationText={fieldState.error?.message}
                    />
                )}
            />
            <Controller
                name="retryDelayMs"
                render={({ field, fieldState }) => (
                    <InputField
                        label={i18n.t('Retry delay (ms)')}
                        type="number"
                        value={
                            field.value === undefined ? '' : String(field.value)
                        }
                        onChange={({ value }) =>
                            field.onChange(
                                value === '' ? undefined : Number(value)
                            )
                        }
                        onBlur={field.onBlur}
                        helpText={i18n.t('Wait before each retry.')}
                        error={Boolean(fieldState.error)}
                        validationText={fieldState.error?.message}
                    />
                )}
            />
        </div>
    )
}
