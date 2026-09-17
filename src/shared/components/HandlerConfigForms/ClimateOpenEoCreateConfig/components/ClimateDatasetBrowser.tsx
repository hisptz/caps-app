import { useDataEngine } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import { NoticeBox, SimpleSingleSelectField } from '@dhis2/ui'
import React from 'react'
import { useController } from 'react-hook-form'
import { useClimateDatasetsQuery } from '@/modules/climate-data/hooks/useClimateDatasetsQuery'

export function ClimateDatasetBrowser(): React.ReactElement {
    const { field, fieldState } = useController({
        name: 'handlerConfig.datasetId',
    })
    const engine = useDataEngine()
    const datasetsQuery = useClimateDatasetsQuery(engine)

    if (datasetsQuery.error) {
        return (
            <NoticeBox error title={i18n.t('Could not load climate datasets')}>
                {i18n.t('Check CLIMATE_API_BASE_URL configuration.')}
            </NoticeBox>
        )
    }

    const datasets = datasetsQuery.data?.items ?? []

    return (
        <SimpleSingleSelectField
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
                label: dataset.short_name ?? dataset.dataset_name,
                value: dataset.dataset_id,
            }))}
        />
    )
}
