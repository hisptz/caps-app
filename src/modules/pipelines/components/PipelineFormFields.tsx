import i18n from '@dhis2/d2-i18n'
import { InputField, SwitchField, TextAreaField } from '@dhis2/ui'
import React from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import classes from './PipelineModal.module.css'
import { PIPELINE_CONCURRENCY_OPTIONS } from './pipelineModalShared'
import type { PipelineFormValues } from '@/modules/pipelines/schemas/pipelineFormSchema'
import {
    FormSection,
    RadioCardGroup,
} from '@/shared/components/ui/FormPrimitives'

type Props = {
    namePlaceholder?: string
    showHelperText?: boolean
}

export function PipelineFormFields({
    namePlaceholder,
    showHelperText = false,
}: Props): React.ReactElement {
    const { control } = useFormContext<PipelineFormValues>()

    return (
        <>
            <FormSection num={1} title={i18n.t('Identification')}>
                <Controller
                    name="name"
                    control={control}
                    render={({ field, fieldState }) => (
                        <InputField
                            label={i18n.t('Name')}
                            required
                            placeholder={namePlaceholder}
                            value={field.value}
                            onChange={({ value }) =>
                                field.onChange(value ?? '')
                            }
                            onBlur={field.onBlur}
                            helpText={
                                showHelperText
                                    ? i18n.t(
                                          'Human-readable name shown across CAPS.'
                                      )
                                    : undefined
                            }
                            error={Boolean(fieldState.error)}
                            validationText={fieldState.error?.message}
                        />
                    )}
                />
                <Controller
                    name="description"
                    control={control}
                    render={({ field, fieldState }) => (
                        <TextAreaField
                            label={i18n.t('Description')}
                            value={field.value ?? ''}
                            onChange={({ value }) =>
                                field.onChange(value ?? '')
                            }
                            rows={3}
                            error={Boolean(fieldState.error)}
                            validationText={fieldState.error?.message}
                        />
                    )}
                />
            </FormSection>

            <FormSection
                num={2}
                title={i18n.t('Execution behaviour')}
                description={
                    showHelperText
                        ? i18n.t('How runs are scheduled & overlap')
                        : undefined
                }
            >
                <Controller
                    name="isActive"
                    control={control}
                    render={({ field }) => (
                        <div>
                            <span className={classes.fieldLabel}>
                                {i18n.t('Status')}
                            </span>
                            <div className={classes.switchRow}>
                                <SwitchField
                                    checked={field.value}
                                    onChange={({ checked }) =>
                                        field.onChange(checked)
                                    }
                                    label={
                                        field.value
                                            ? i18n.t('Active')
                                            : i18n.t('Inactive')
                                    }
                                />
                            </div>
                            {showHelperText && (
                                <p className={classes.statusHelp}>
                                    {field.value
                                        ? i18n.t(
                                              'This pipeline runs automatically at its scheduled times.'
                                          )
                                        : i18n.t(
                                              'Scheduled runs are paused until this pipeline is set to active.'
                                          )}
                                </p>
                            )}
                        </div>
                    )}
                />

                <Controller
                    name="concurrencyPolicy"
                    control={control}
                    render={({ field }) => (
                        <div>
                            <span className={classes.fieldLabel}>
                                {i18n.t('Concurrency policy')}
                            </span>
                            <RadioCardGroup
                                name="concurrencyPolicy"
                                value={field.value}
                                onChange={field.onChange}
                                options={PIPELINE_CONCURRENCY_OPTIONS}
                                columns={3}
                            />
                            {showHelperText && (
                                <p className={classes.concurrencyHelp}>
                                    {i18n.t(
                                        'What to do when a new run is triggered while another is still running.'
                                    )}
                                </p>
                            )}
                        </div>
                    )}
                />
            </FormSection>
        </>
    )
}
