import { useDataQuery } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import { SimpleSingleSelectField } from '@dhis2/ui'
import { isEmpty } from 'lodash-es'
import React, { useEffect, useMemo, useState } from 'react'
import { useController } from 'react-hook-form'
import { useDebounceValue } from 'usehooks-ts'
import { mergeDataElementOptions } from './mergeDataElementOptions'

type DataElementRow = { id: string; displayName: string }

const query = {
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

export function DataElementSelector({
    name,
    label,
    valueType,
    dense,
}: {
    name: string
    label: string
    valueType?: string
    dense?: boolean
}) {
    const [keyword, setKeyword] = useState<string | null>(null)

    const [searchedKeyword, setSearchedKeyword] = useDebounceValue(keyword, 400)

    const { field, fieldState } = useController({ name })

    const selectedId =
        typeof field.value === 'string' && field.value.trim() !== ''
            ? field.value.trim()
            : undefined

    const { loading, error, refetch, called, data } = useDataQuery<{
        de: {
            dataElements: DataElementRow[]
        }
        selectedDe: {
            dataElements: DataElementRow[]
        }
    }>(query, {
        variables: {
            keyword: searchedKeyword,
            valueType,
            selectedId,
        },
    })

    const options = useMemo(() => {
        if (!data) {
            return []
        }

        return mergeDataElementOptions(
            data.de.dataElements ?? [],
            data.selectedDe.dataElements ?? []
        )
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
            noMatchText={i18n.t('No matching data elements found')}
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
