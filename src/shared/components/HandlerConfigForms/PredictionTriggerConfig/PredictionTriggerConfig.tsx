import i18n from '@dhis2/d2-i18n'
import { InputField } from '@dhis2/ui'
import React from 'react'
import { get, set } from '../configHelpers'
import { OrgUnitSection } from '../OrgUnitSection'
import { PredictionPeriodFields } from '../PredictionPeriodFields'
import { DataSourceSection } from '@/shared/components/HandlerConfigForms/PredictionTriggerConfig/DataSourceSection'
import { ModelSelector } from '@/shared/components/HandlerConfigForms/PredictionTriggerConfig/ModelSelector'
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
    function handleOrgUnitChange(orgUnit: Record<string, unknown>): void {
        onChange({ ...(value ?? {}), ...orgUnit })
    }

    return (
        <>
            <div className={formSectionGrids.grid2}>
                <ModelSelector />
                <InputField
                    label={i18n.t('Name')}
                    required
                    helpText={i18n.t('Identifies the job in CHAP.')}
                    value={get(value, 'name')}
                    onChange={({ value: v }) => onChange(set(value, 'name', v))}
                />
            </div>

            <FormSection title={i18n.t('Period')} tight>
                <PredictionPeriodFields />
            </FormSection>
            <FormSection
                title={i18n.t('Organisation units')}
                description={i18n.t('At least one of levels / ids')}
                tight
            >
                <OrgUnitSection value={value} onChange={handleOrgUnitChange} />
            </FormSection>
            <DataSourceSection />
        </>
    )
}
