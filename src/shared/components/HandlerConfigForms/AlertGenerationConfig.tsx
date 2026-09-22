import i18n from '@dhis2/d2-i18n'
import { SingleSelectField, SingleSelectOption } from '@dhis2/ui'
import React, { useEffect } from 'react'
import { Controller, useFormContext, type ArrayPath } from 'react-hook-form'
import { DataElementSelector } from './DataElementSelector'
import { OrganisationUnitConfigSection } from './OrganisationUnitConfigSection'
import { ThresholdDataElementIdsList } from './ThresholdDataElementIdsList'
import classes from './ThresholdGenerationConfig.module.css'
import {
    alertPeriodHelpText,
    DEFAULT_AGGREGATION_TYPE,
} from '@/modules/alert-generation/constants'
import {
    emitAlertConfig,
    ensureEditableOrgUnit,
    ensureEditablePeriods,
    ensureEditableValueDataElementIds,
    normalizeAlertConfigForLoad,
} from '@/modules/alert-generation/normalizeConfig'
import type { PipelineStepFormWithHandlerValues } from '@/modules/pipeline-detail/schemas/stepFormSchema'
import { AlertPeriodSelector } from '@/shared/components/HandlerConfigForms/AlertPeriodSelector'
import { FormSection } from '@/shared/components/ui/FormPrimitives'

export interface AlertGenerationConfigProps {
    value: Record<string, unknown> | null
    onChange: (v: Record<string, unknown>) => void
}

export function AlertGenerationConfig({
    value,
    onChange,
}: AlertGenerationConfigProps): React.ReactElement {
    const { control, setValue, getValues } =
        useFormContext<PipelineStepFormWithHandlerValues>()

    useEffect(() => {
        const raw = getValues('handlerConfig') ?? value
        const normalized = normalizeAlertConfigForLoad(
            raw as Record<string, unknown> | null
        )
        const editable = ensureEditableValueDataElementIds(
            ensureEditablePeriods(ensureEditableOrgUnit(normalized))
        )
        setValue('handlerConfig', editable, { shouldDirty: false })
        onChange(emitAlertConfig(editable))
    }, [])

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className={classes.aggregationRow}>
                <Controller
                    name="handlerConfig.aggregationType"
                    control={control}
                    render={({ field, fieldState }) => (
                        <SingleSelectField
                            label={i18n.t('Aggregation type')}
                            selected={
                                typeof field.value === 'string' &&
                                field.value.trim()
                                    ? field.value
                                    : DEFAULT_AGGREGATION_TYPE
                            }
                            onChange={({ selected }) =>
                                field.onChange(selected)
                            }
                            onBlur={field.onBlur}
                            error={Boolean(fieldState.error)}
                            validationText={fieldState.error?.message}
                        >
                            <SingleSelectOption
                                value="SUM"
                                label={i18n.t('Sum')}
                            />
                            <SingleSelectOption
                                value="MEAN"
                                label={i18n.t('Average')}
                            />
                        </SingleSelectField>
                    )}
                />
            </div>
            <FormSection title={i18n.t('Organisation units')} tight>
                <OrganisationUnitConfigSection />
            </FormSection>
            <FormSection
                title={i18n.t('Periods')}
                description={alertPeriodHelpText()}
                tight
            >
                <AlertPeriodSelector />
            </FormSection>

            <FormSection
                title={i18n.t('Threshold data item')}
                description={i18n.t(
                    'Aggregate threshold value fetched from DHIS2 for comparison.'
                )}
                tight
            >
                <DataElementSelector
                    name="handlerConfig.thresholdDataElementId"
                    label={i18n.t('Threshold data item')}
                    allowIndicators
                />
            </FormSection>
            <FormSection
                title={i18n.t('Prediction quantile data elements')}
                description={i18n.t(
                    'Map each row to a prediction quantile data element (same UIDs as the prediction-data-download step). An alert is created when any listed element’s aggregate value meets or exceeds the threshold for the period.'
                )}
                tight
            >
                <ThresholdDataElementIdsList
                    arrayPath={
                        'handlerConfig.valueDataElementIds' as ArrayPath<PipelineStepFormWithHandlerValues>
                    }
                    sectionLabel={i18n.t('Quantile data element')}
                    itemLabel={i18n.t('Quantile data element')}
                    addLabel={i18n.t('Add quantile data element')}
                />
            </FormSection>
        </div>
    )
}
