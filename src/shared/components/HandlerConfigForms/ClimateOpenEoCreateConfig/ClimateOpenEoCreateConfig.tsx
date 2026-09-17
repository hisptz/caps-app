import i18n from '@dhis2/d2-i18n'
import React, { useEffect } from 'react'
import { useController } from 'react-hook-form'
import { ConfigLabeledControl } from '../ConfigLabeledControl'
import { OrgUnitSection } from '../OrgUnitSection'
import { ClimateDatasetBrowser } from '@/shared/components/HandlerConfigForms/ClimateOpenEoCreateConfig/components/ClimateDatasetBrowser'
import { ClimateDatasetPeriodSelector } from '@/shared/components/HandlerConfigForms/ClimateOpenEoCreateConfig/components/ClimateDatasetPeriodSelector'
import { ClimateDatasetVariables } from '@/shared/components/HandlerConfigForms/ClimateOpenEoCreateConfig/components/ClimateDatasetVariables'
import { DataElementSelector } from '@/shared/components/HandlerConfigForms/DataElementSelector'
import {
    FormSection,
    formSectionGrids,
    SegmentedControl,
} from '@/shared/components/ui/FormPrimitives'

export interface ClimateOpenEoCreateConfigProps {
    value: Record<string, unknown> | null
    onChange: (v: Record<string, unknown>) => void
}

const DEFAULT_AGG_METHOD = 'mean'

const AGG_OPTIONS = [
    { value: 'mean', label: i18n.t('Average') },
    { value: 'min', label: i18n.t('Min') },
    { value: 'max', label: i18n.t('Max') },
    { value: 'sum', label: i18n.t('Sum') },
] as const

export function ClimateOpenEoCreateConfig({
    value,
    onChange,
}: ClimateOpenEoCreateConfigProps): React.ReactElement {
    function handleOrgUnitChange(orgUnit: Record<string, unknown>): void {
        onChange({ ...(value ?? {}), ...orgUnit })
    }
    const aggregationMethod = useController({
        name: 'handlerConfig.aggregation.method',
    })
    const method =
        typeof aggregationMethod.field.value === 'string' &&
        aggregationMethod.field.value
            ? aggregationMethod.field.value
            : DEFAULT_AGG_METHOD

    const setAggregationMethod = aggregationMethod.field.onChange
    const hasAggregationMethod = Boolean(aggregationMethod.field.value)
    useEffect(() => {
        if (!hasAggregationMethod) {
            setAggregationMethod(DEFAULT_AGG_METHOD)
        }
    }, [hasAggregationMethod, setAggregationMethod])

    return (
        <>
            <FormSection
                title={i18n.t('Dataset')}
                description={i18n.t(
                    'Managed climate dataset from the Open Climate Service'
                )}
                tight
            >
                <ClimateDatasetBrowser />
                <ClimateDatasetVariables />
            </FormSection>

            <FormSection
                title={i18n.t('Variable')}
                description={i18n.t('Climate variable → DHIS2 data element')}
                tight
            >
                <div className={formSectionGrids.grid2}>
                    <DataElementSelector
                        label={i18n.t('Data element')}
                        name="handlerConfig.variable.dataElement"
                        valueType="NUMBER"
                    />
                </div>
            </FormSection>

            <FormSection title={i18n.t('Aggregation')} tight>
                <ConfigLabeledControl
                    label={i18n.t('Aggregation method')}
                    helpText={i18n.t(
                        'How values are aggregated across the period and org units.'
                    )}
                >
                    <SegmentedControl
                        name="climate-openeo-aggregation"
                        value={method}
                        options={AGG_OPTIONS}
                        onChange={(selected) => setAggregationMethod(selected)}
                        aria-label={i18n.t('Aggregation method')}
                    />
                </ConfigLabeledControl>
            </FormSection>

            <FormSection title={i18n.t('Period')} tight>
                <ClimateDatasetPeriodSelector />
            </FormSection>

            <FormSection
                title={i18n.t('Organisation units')}
                description={i18n.t('At least one of levels / ids')}
                tight
            >
                <OrgUnitSection value={value} onChange={handleOrgUnitChange} />
            </FormSection>
        </>
    )
}
