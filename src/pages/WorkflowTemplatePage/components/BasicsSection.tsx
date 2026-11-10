import i18n from '@dhis2/d2-i18n'
import {
    InputField,
    SingleSelectField,
    SingleSelectOption,
    SwitchField,
    TextAreaField,
} from '@dhis2/ui'
import React from 'react'
import { Controller, useFormContext, useWatch } from 'react-hook-form'
import { CronPanel } from '@/modules/pipeline-detail/components/CronPanel'
import type { TemplateFormValues } from '@/modules/workflows/schemas/templateFormSchema'
import { FormSection } from '@/shared/components/ui/FormPrimitives'

/** Name, schedule and the periods each run works on. */
export function BasicsSection(): React.ReactElement {
    const { control, setValue } = useFormContext<TemplateFormValues>()
    const scheduled = useWatch({ control, name: 'scheduled' })
    const periodType = useWatch({ control, name: 'periodType' })

    return (
        <FormSection num={1} title={i18n.t('Workflow')}>
            <Controller
                name="name"
                control={control}
                render={({ field, fieldState }) => (
                    <InputField
                        label={i18n.t('Name')}
                        required
                        value={field.value}
                        onChange={({ value }) => field.onChange(value ?? '')}
                        onBlur={field.onBlur}
                        error={Boolean(fieldState.error)}
                        validationText={fieldState.error?.message}
                        helpText={i18n.t(
                            'Its pipelines are named after it, e.g. "Weekly malaria · Climate data"'
                        )}
                    />
                )}
            />
            <Controller
                name="description"
                control={control}
                render={({ field }) => (
                    <TextAreaField
                        label={i18n.t('Description')}
                        value={field.value}
                        onChange={({ value }) => field.onChange(value ?? '')}
                        rows={2}
                    />
                )}
            />
            <Controller
                name="periodType"
                control={control}
                render={({ field }) => (
                    <SingleSelectField
                        label={i18n.t('Period type')}
                        helpText={i18n.t(
                            'How the data is reported; with a prediction setup, it must match the setup'
                        )}
                        selected={field.value}
                        onChange={({ selected }) => {
                            field.onChange(selected)
                            setValue('backfillStart', '')
                            setValue('backfillEnd', '')
                        }}
                    >
                        <SingleSelectOption
                            value="WEEKLY"
                            label={i18n.t('Weekly')}
                        />
                        <SingleSelectOption
                            value="MONTHLY"
                            label={i18n.t('Monthly')}
                        />
                    </SingleSelectField>
                )}
            />
            <Controller
                name="recentPeriods"
                control={control}
                render={({ field, fieldState }) => (
                    <InputField
                        type="number"
                        min="1"
                        label={
                            periodType === 'MONTHLY'
                                ? i18n.t('Months to fetch on each run')
                                : i18n.t('Weeks to fetch on each run')
                        }
                        helpText={
                            periodType === 'MONTHLY'
                                ? i18n.t(
                                      'Each run fetches the latest months again, so values reported late are picked up'
                                  )
                                : i18n.t(
                                      'Each run fetches the latest weeks again, so values reported late are picked up'
                                  )
                        }
                        value={String(field.value)}
                        onChange={({ value }) => field.onChange(Number(value))}
                        error={Boolean(fieldState.error)}
                        validationText={fieldState.error?.message}
                        inputWidth="120px"
                    />
                )}
            />
            <Controller
                name="scheduled"
                control={control}
                render={({ field }) => (
                    <SwitchField
                        checked={field.value}
                        onChange={({ checked }) => field.onChange(checked)}
                        label={i18n.t('Run on a schedule')}
                        helpText={
                            field.value
                                ? undefined
                                : i18n.t(
                                      'Off, start it with the Trigger button'
                                  )
                        }
                    />
                )}
            />
            {scheduled && <CronPanel />}
        </FormSection>
    )
}
