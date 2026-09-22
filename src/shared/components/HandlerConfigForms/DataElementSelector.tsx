import { useDataQuery } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import { SimpleSingleSelectField } from '@dhis2/ui'
import { isEmpty } from 'lodash-es'
import React, { useEffect, useMemo, useState } from 'react'
import { useController } from 'react-hook-form'
import { useDebounceValue } from 'usehooks-ts'
import { mergeDataElementOptions } from './mergeDataElementOptions'

type DataElementRow = { id: string; displayName: string }

type SelectorResponse = {
    de: { dataElements?: DataElementRow[]; dataItems?: DataElementRow[] }
    selectedDe: {
        dataElements?: DataElementRow[]
        dataItems?: DataElementRow[]
    }
}

const DX_ITEM_TYPES = ['DATA_ELEMENT', 'INDICATOR', 'PROGRAM_INDICATOR']

/**
 * Data-element-only lookup, for fields whose value is a *write* target
 * (posted to `/dataValueSets`). Indicators are computed and cannot be
 * written to, so they must not appear here.
 */
const dataElementQuery = {
    de: {
        resource: 'dataElements',
        params: ({
            keyword,
            valueType,
        }: {
            keyword?: string
            valueType?: string
        }) => {
            const filters = []

            if (valueType) {
                filters.push(`valueType:eq:${valueType}`)
            }

            if (keyword) {
                filters.push(`identifiable:token:${keyword}`)
            }

            return {
                fields: 'id,displayName',
                filter: isEmpty(filters) ? undefined : filters,
                order: 'displayName:asc',
                page: 1,
                pageSize: 20,
            }
        },
    },
    selectedDe: {
        resource: 'dataElements',
        params: ({
            selectedId,
            valueType,
        }: {
            selectedId?: string
            valueType?: string
        }) => {
            if (!selectedId) {
                return { fields: 'id,displayName', pageSize: 0 }
            }

            const filters = [`id:eq:${selectedId}`]

            if (valueType) {
                filters.push(`valueType:eq:${valueType}`)
            }

            return {
                fields: 'id,displayName',
                filter: filters,
            }
        },
    },
}

const dataItemQuery = {
    de: {
        resource: 'dataItems',
        params: ({
            keyword,
            valueType,
        }: {
            keyword?: string
            valueType?: string
        }) => {
            const filters = [
                `dimensionItemType:in:[${DX_ITEM_TYPES.join(',')}]`,
            ]

            if (valueType) {
                filters.push(`valueType:eq:${valueType}`)
            }

            if (keyword) {
                filters.push(`displayName:ilike:${keyword}`)
            }

            return {
                fields: 'id,displayName',
                filter: filters,
                order: 'displayName:asc',
                page: 1,
                pageSize: 20,
            }
        },
    },
    selectedDe: {
        resource: 'dataItems',
        params: ({
            selectedId,
            valueType,
        }: {
            selectedId?: string
            valueType?: string
        }) => {
            const filters = [
                `dimensionItemType:in:[${DX_ITEM_TYPES.join(',')}]`,
                `id:eq:${selectedId ?? '__none__'}`,
            ]

            if (valueType) {
                filters.push(`valueType:eq:${valueType}`)
            }

            return {
                fields: 'id,displayName',
                filter: filters,
            }
        },
    },
}

function rowsOf(
    result:
        | { dataElements?: DataElementRow[]; dataItems?: DataElementRow[] }
        | undefined
): DataElementRow[] {
    return result?.dataItems ?? result?.dataElements ?? []
}

export function DataElementSelector({
    name,
    label,
    valueType,
    dense,
    allowIndicators = false,
}: {
    name: string
    label: string
    valueType?: string
    dense?: boolean
    allowIndicators?: boolean
}) {
    const [keyword, setKeyword] = useState<string | null>(null)

    const [searchedKeyword, setSearchedKeyword] = useDebounceValue(keyword, 400)

    const { field, fieldState } = useController({ name })

    const selectedId =
        typeof field.value === 'string' && field.value.trim() !== ''
            ? field.value.trim()
            : undefined

    const { loading, error, refetch, called, data } =
        useDataQuery<SelectorResponse>(
            allowIndicators ? dataItemQuery : dataElementQuery,
            {
                variables: {
                    keyword: searchedKeyword,
                    valueType,
                    selectedId,
                },
            }
        )

    const options = useMemo(() => {
        if (!data) {
            return []
        }

        return mergeDataElementOptions(rowsOf(data.de), rowsOf(data.selectedDe))
    }, [data])

    const selectedOptionLoaded =
        !selectedId || options.some((option) => option.value === field.value)

    useEffect(() => {
        const variables = {
            keyword: searchedKeyword ?? undefined,
            valueType,
            selectedId,
        }

        if (searchedKeyword) {
            refetch(variables)
        } else if (called) {
            refetch(variables)
        }
    }, [searchedKeyword, selectedId, valueType, called, refetch])

    return (
        <SimpleSingleSelectField
            name={name}
            dense={dense}
            label={label}
            value={
                selectedOptionLoaded ? (field.value ?? undefined) : undefined
            }
            onChange={field.onChange}
            options={options}
            filterable
            filterValue={keyword ?? undefined}
            filterPlaceholder="Search by name or id"
            noMatchText={
                allowIndicators
                    ? i18n.t('No matching data items found')
                    : i18n.t('No matching data elements found')
            }
            onFilterChange={(key) => {
                setKeyword(key)
                setSearchedKeyword(key)
            }}
            loading={loading || (!selectedOptionLoaded && !!selectedId)}
            error={!!error || !!fieldState.error}
            validationText={error?.message || fieldState.error?.message}
        />
    )
}
