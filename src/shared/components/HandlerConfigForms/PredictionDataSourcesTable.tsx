import i18n from '@dhis2/d2-i18n'
// eslint-disable-next-line import/named
import { colors } from '@dhis2/ui'
import { isEqual } from 'lodash-es'
import React, { useEffect, useMemo } from 'react'
import { useController } from 'react-hook-form'
import { ConfigMappingTable } from './ConfigMappingTable'
import { DataElementSelector } from '@/shared/components/HandlerConfigForms/DataElementSelector'
import { useSelectedModel } from '@/shared/components/HandlerConfigForms/PredictionTriggerConfig/hooks/useSelectedModel'

const DATA_SOURCE_GRID = '120px 1fr'

export function PredictionDataSourcesTable(): React.ReactElement {
    const { field } = useController({
        name: `handlerConfig.dataSources`,
    })

    const selectedModel = useSelectedModel()
    const features = useMemo(() => {
        const target = selectedModel?.target
        const covariates = (selectedModel?.covariates ?? []).filter(
            ({ name }) => name !== target?.name
        )
        return target
            ? [
                  {
                      name: target.name,
                      displayName: i18n.t('{{name}} (target)', {
                          name: target.displayName,
                      }),
                  },
                  ...covariates,
              ]
            : covariates
    }, [selectedModel])

    useEffect(() => {
        if (!selectedModel) {
            return
        }
        const existing = Array.isArray(field.value)
            ? (field.value as Array<Record<string, unknown>>)
            : []
        const next = features.map(({ name }) => ({
            covariate: name,
            dataElementId:
                existing.find((row) => row?.covariate === name)
                    ?.dataElementId ?? null,
        }))
        if (!isEqual(next, existing)) {
            field.onChange(next)
        }
    }, [selectedModel])

    if (!selectedModel) {
        return (
            <div
                style={{
                    display: 'flex',
                    width: '100%',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <p style={{ fontSize: 14, color: colors.grey600 }}>
                    {i18n.t('Select a model to configure covariates')}
                </p>
            </div>
        )
    }

    return (
        <ConfigMappingTable
            columns={[i18n.t('Covariate (CHAP)'), i18n.t('DHIS2 data item')]}
            gridTemplateColumns={DATA_SOURCE_GRID}
            rowCount={features.length}
            renderRow={(index) => (
                <>
                    <p
                        style={{
                            fontSize: 14,
                            fontWeight: 'normal',
                            margin: 0,
                        }}
                    >
                        {features[index]?.displayName}
                    </p>
                    <DataElementSelector
                        dense
                        name={`handlerConfig.dataSources[${index}].dataElementId`}
                        label=""
                        allowIndicators
                    />
                </>
            )}
            emptyMessage={i18n.t('This model does not declare any covariates.')}
        />
    )
}
