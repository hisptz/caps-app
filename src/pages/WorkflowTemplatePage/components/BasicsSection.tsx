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
export function BasicsSection({
    withPrediction = false,
}: {
    /** The form has a prediction section, whose setup decides the period type */
    withPrediction?: boolean
}): React.ReactElement {
    const { control, setValue } = useFormContext<TemplateFormValues>()
    const scheduled = useWatch({ control, name: 'scheduled' })
    const periodType = useWatch({ control, name: 'periodType' })
    const setupId = useWatch({ control, name: 'predictionSetupId' })
    // The prediction setup was evaluated on one period type; the data must match it
    const fromSetup = withPrediction && Boolean(setupId)

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
                        disabled={fromSetup}
                        helpText={
                            fromSetup
                                ? i18n.t('Set by the prediction setup')
                                : withPrediction
                                  ? i18n.t(
                                        'How the data is reported. Choosing a prediction setup sets it to match.'
                                    )
                                  : i18n.t('How the data is reported')
                        }
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
                                      'The last complete months; the current month is left out. Fetching them again picks up values reported late.'
                                  )
                                : i18n.t(
                                      'The last complete weeks; the current week is left out. Fetching them again picks up values reported late.'
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
