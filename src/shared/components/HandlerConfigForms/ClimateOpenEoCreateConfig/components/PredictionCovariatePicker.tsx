import { useDataQuery } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import { SimpleSingleSelectField } from '@dhis2/ui'
import React, { useEffect, useMemo } from 'react'
import { useController } from 'react-hook-form'
import { usePipelinePredictionSetup } from '@/shared/components/HandlerConfigForms/usePipelinePredictionSetup'

const DATA_ELEMENT_FIELD = 'handlerConfig.variable.dataElement'

// Matches the `valueType` the data element selector below accepts.
const WRITABLE_VALUE_TYPE = 'NUMBER'

type ValueTypesResponse = {
    de: { dataElements?: Array<{ id: string; valueType: string }> }
}

const valueTypesQuery = {
    de: {
        resource: 'dataElements',
        params: ({ ids }: { ids?: string[] }) => ({
            fields: 'id,valueType',
            filter: [`id:in:[${(ids ?? []).join(',')}]`],
            paging: false,
        }),
    },
}

/**
 * Lets the download write straight to a covariate of the pipeline's CHAP prediction setup, so
 * the data element matches the one the prediction reads. Hidden until the pipeline has one.
 */
export function PredictionCovariatePicker(): React.ReactElement | null {
    const setup = usePipelinePredictionSetup()
    const { field } = useController({ name: DATA_ELEMENT_FIELD })
    const { data, refetch } = useDataQuery<ValueTypesResponse>(
        valueTypesQuery,
        { lazy: true }
    )

    const ids = useMemo(
        () => setup?.covariateSources.map((s) => s.dataElementId) ?? [],
        [setup]
    )
    useEffect(() => {
        if (ids.length > 0) {
            void refetch({ ids })
        }
    }, [ids.join(',')])

    // Covariates such as case counts come from DHIS2 itself and are not NUMBER data elements,
    // so the download cannot write them anyway.
    const writable = useMemo(() => {
        const numeric = new Set(
            (data?.de?.dataElements ?? [])
                .filter((de) => de.valueType === WRITABLE_VALUE_TYPE)
                .map((de) => de.id)
        )
        return (setup?.covariateSources ?? []).filter((s) =>
            numeric.has(s.dataElementId)
        )
    }, [data, setup])

    if (!setup || writable.length === 0) {
        return null
    }

    const current = typeof field.value === 'string' ? field.value : ''
    const matched = writable.find((s) => s.dataElementId === current)

    return (
        <SimpleSingleSelectField
            name="climate-openeo-prediction-covariate"
            label={i18n.t('Prediction covariate')}
            value={matched?.dataElementId}
            options={writable.map((s) => ({
                value: s.dataElementId,
                label: s.covariate,
            }))}
            onChange={(value) => field.onChange(value)}
            helpText={
                matched
                    ? i18n.t(
                          'Writes the data element prediction setup "{{name}}" reads for this covariate.',
                          {
                              name: setup.name,
                              interpolation: { escapeValue: false },
                          }
                      )
                    : undefined
            }
            warning={Boolean(current) && !matched}
            validationText={
                current && !matched
                    ? i18n.t(
                          'Prediction setup "{{name}}" does not read this data element. Pick a covariate so the prediction sees this data.',
                          {
                              name: setup.name,
                              interpolation: { escapeValue: false },
                          }
                      )
                    : undefined
            }
        />
    )
}
