import i18n from '@dhis2/d2-i18n'
import { CheckboxField } from '@dhis2/ui'
import React from 'react'
import { Controller, useFormContext, useWatch } from 'react-hook-form'
import classes from '../WorkflowTemplatePage.module.css'
import type { TemplateFormValues } from '@/modules/workflows/schemas/templateFormSchema'
import { FixedPeriodSelector } from '@/shared/components/HandlerConfigForms/FixedPeriodSelector'
import { FormSection } from '@/shared/components/ui/FormPrimitives'

/** Run once straight away over a range of history, so staging starts with data. */
export function BackfillSection(): React.ReactElement {
    const { control } = useFormContext<TemplateFormValues>()
    const backfill = useWatch({ control, name: 'backfill' })

    return (
        <FormSection num={6} title={i18n.t('History')}>
            <Controller
                name="backfill"
                control={control}
                render={({ field }) => (
                    <CheckboxField
                        checked={field.value}
                        onChange={({ checked }) => field.onChange(checked)}
                        label={i18n.t('Backfill history when created')}
                        helpText={i18n.t(
                            'A new staging instance has no history to evaluate a model on. This runs the data pipelines once over the range; later runs refresh only recent periods. You can also do it later with Run for a fixed range.'
                        )}
                    />
                )}
            />
            {backfill && (
                <div className={classes.rangeFields}>
                    <FixedPeriodSelector
                        periodTypeKey="periodType"
                        name="backfillStart"
                        label={i18n.t('From')}
                    />
                    <FixedPeriodSelector
                        periodTypeKey="periodType"
                        name="backfillEnd"
                        label={i18n.t('To')}
                    />
                </div>
            )}
        </FormSection>
    )
}
