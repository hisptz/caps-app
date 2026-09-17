import i18n from '@dhis2/d2-i18n'
import React from 'react'
import { PredictionDataSourcesTable } from '@/shared/components/HandlerConfigForms/PredictionDataSourcesTable'
import { useSelectedModel } from '@/shared/components/HandlerConfigForms/PredictionTriggerConfig/hooks/useSelectedModel'
import { FormSection } from '@/shared/components/ui/FormPrimitives'

export function DataSourceSection() {
    const selectedModel = useSelectedModel()

    if (!selectedModel) {
        return null
    }

    return (
        <FormSection title={i18n.t('Data sources')} tight>
            <PredictionDataSourcesTable />
        </FormSection>
    )
}
