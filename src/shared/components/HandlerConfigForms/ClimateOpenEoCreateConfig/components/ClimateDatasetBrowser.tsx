import { useDataEngine } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import { NoticeBox } from '@dhis2/ui'
import React from 'react'
import { useController } from 'react-hook-form'
import { useClimateCollectionsQuery } from '@/modules/climate-data/hooks/useClimateCollectionsQuery'
import { SearchableSimpleSelectField } from '@/shared/components/ui/FormPrimitives'

export function ClimateDatasetBrowser(): React.ReactElement {
    const { field, fieldState } = useController({
        name: 'handlerConfig.datasetId',
    })
    const engine = useDataEngine()
    const datasetsQuery = useClimateCollectionsQuery(engine)

    if (datasetsQuery.error) {
        return (
            <NoticeBox error title={i18n.t('Could not load climate datasets')}>
                {i18n.t('Check CLIMATE_API_BASE_URL configuration.')}
            </NoticeBox>
        )
    }

    const datasets = datasetsQuery.data ?? []

    return (
        <SearchableSimpleSelectField
            error={!!fieldState.error?.message}
            validationText={fieldState.error?.message}
            name="handlerConfig.datasetId"
            label={i18n.t('Climate dataset')}
            value={datasetsQuery.data ? (field.value ?? undefined) : undefined}
            loading={datasetsQuery.isLoading}
            onChange={(value) => {
                field.onChange(value)
            }}
            options={datasets.map((dataset) => ({
                label: dataset.title,
                value: dataset.id,
            }))}
        />
    )
}
