import { useDataEngine } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import { CircularLoader, InputField } from '@dhis2/ui'
import React from 'react'
import { useWatch } from 'react-hook-form'
import { useClimateDatasetDetailQuery } from '@/modules/climate-data/hooks/useClimateDatasetDetailQuery'

export function ClimateDatasetVariables(): React.ReactElement | null {
    const engine = useDataEngine()
    const datasetId = useWatch({
        name: 'handlerConfig.datasetId',
    })
    const { isLoading, data } = useClimateDatasetDetailQuery(engine, datasetId)

    if (!datasetId) {
        return null
    }

    if (isLoading) {
        return (
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                    minHeight: 200,
                }}
            >
                <CircularLoader small />
            </div>
        )
    }

    return (
        <InputField
            label={i18n.t('Variable')}
            name="climate-dataset-variable"
            value={data?.variable ?? ''}
            disabled
            readOnly
        />
    )
}
