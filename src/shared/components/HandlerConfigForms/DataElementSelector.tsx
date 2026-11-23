import { useDataEngine } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import { SimpleSingleSelectField } from '@dhis2/ui'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import React, { useEffect, useMemo, useState } from 'react'
import { useController } from 'react-hook-form'
import { useDebounceValue } from 'usehooks-ts'
import { dataItemOptionComponent } from './DataItemOption'
import {
    type DataElementRow,
    mergeDataElementOptions,
} from './mergeDataElementOptions'

const DX_ITEM_TYPES = ['DATA_ELEMENT', 'INDICATOR', 'PROGRAM_INDICATOR']
const PAGE_SIZE = 50

type Page = {
    dataElements?: DataElementRow[]
    dataItems?: DataElementRow[]
    pager?: { page: number; pageCount: number }
}

function lookup(allowIndicators: boolean) {
    return allowIndicators
        ? {
              resource: 'dataItems',
              fields: 'id,displayName,dimensionItemType',
              baseFilters: [
                  `dimensionItemType:in:[${DX_ITEM_TYPES.join(',')}]`,
              ],
              keywordFilter: (keyword: string) =>
                  `displayName:ilike:${keyword}`,
          }
        : {
              resource: 'dataElements',
              fields: 'id,displayName',
              baseFilters: [] as string[],
              keywordFilter: (keyword: string) =>
                  `identifiable:token:${keyword}`,
          }
}

function rowsOf(page: Page | undefined, allowIndicators: boolean) {
    const rows = page?.dataItems ?? page?.dataElements ?? []
    return allowIndicators
        ? rows
        : rows.map((row) => ({
              ...row,
              dimensionItemType: 'DATA_ELEMENT' as const,
          }))
}

export function DataElementSelector({
    name,
    label,
    valueType,
    dense,
    allowIndicators = false,
    helpText,
    dataSetId,
}: {
    name: string
    label: string
    helpText?: string
    valueType?: string
    dense?: boolean
    allowIndicators?: boolean
    /** Only the data elements of this data set. */
    dataSetId?: string
}) {
    const engine = useDataEngine()
    const [keyword, setKeyword] = useState('')
    const [searchedKeyword] = useDebounceValue(keyword.trim(), 400)

    const { field, fieldState } = useController({ name })

    const selectedId =
        typeof field.value === 'string' && field.value.trim() !== ''
            ? field.value.trim()
            : undefined

    const { resource, fields, baseFilters, keywordFilter } =
        lookup(allowIndicators)
    const valueFilters = [
        ...(valueType ? [`valueType:eq:${valueType}`] : []),
        ...(dataSetId && !allowIndicators
            ? [`dataSetElements.dataSet.id:eq:${dataSetId}`]
            : []),
    ]

    const search = useInfiniteQuery({
        queryKey: [
            'dhis2',
            'data-element-selector',
            resource,
            valueType,
            dataSetId,
            searchedKeyword,
        ],
        keepPreviousData: true,
        staleTime: 60_000,
        queryFn: async ({ pageParam = 1 }) => {
            const filter = [...baseFilters, ...valueFilters]
            if (searchedKeyword) {
                filter.push(keywordFilter(searchedKeyword))
            }
            const result = (await engine.query({
                page: {
                    resource,
                    params: {
                        fields,
                        filter,
                        order: 'displayName:asc',
                        page: pageParam,
                        pageSize: PAGE_SIZE,
                    },
                },
            })) as { page: Page }
            return result.page
        },
        getNextPageParam: (last) =>
            last.pager && last.pager.page < last.pager.pageCount
                ? last.pager.page + 1
                : undefined,
    })

    // The saved value may sit beyond the loaded pages; look it up on its own.
    const selected = useQuery({
        queryKey: [
            'dhis2',
            'data-element-selector',
            resource,
            valueType,
            dataSetId,
            'id',
            selectedId,
        ],
        enabled: Boolean(selectedId),
        staleTime: 60_000,
        queryFn: async () => {
            const result = (await engine.query({
                page: {
                    resource,
                    params: {
                        fields,
                        filter: [
                            ...baseFilters,
                            ...valueFilters,
                            `id:eq:${selectedId}`,
                        ],
                        paging: false,
                    },
                },
            })) as { page: Page }
            return result.page
        },
    })

    const options = useMemo(
        () =>
            mergeDataElementOptions(
                (search.data?.pages ?? []).flatMap((page) =>
                    rowsOf(page, allowIndicators)
                ),
                rowsOf(selected.data, allowIndicators)
            ).map(({ value, label, type }) => ({
                value,
                label,
                component: dataItemOptionComponent(type),
            })),
        [search.data, selected.data, allowIndicators]
    )

    // A data element outside the chosen data set is not one it accepts: let it go.
    const notInDataSet =
        Boolean(dataSetId && selectedId) &&
        selected.isSuccess &&
        !selected.isFetching &&
        rowsOf(selected.data, allowIndicators).length === 0
    useEffect(() => {
        if (notInDataSet) {
            field.onChange('')
        }
    }, [notInDataSet, field])

    const selectedOptionLoaded =
        !selectedId || options.some((option) => option.value === field.value)
    const error = search.error ?? selected.error

    return (
        <SimpleSingleSelectField
            name={name}
            dense={dense}
            label={label}
            helpText={helpText}
            value={
                selectedOptionLoaded ? (field.value ?? undefined) : undefined
            }
            onChange={field.onChange}
            options={options}
            filterable
            filterValue={keyword}
            filterPlaceholder={i18n.t('Search by name or id')}
            noMatchText={
                allowIndicators
                    ? i18n.t('No matching data items found')
                    : i18n.t('No matching data elements found')
            }
            onFilterChange={(next) => setKeyword(next ?? '')}
            onEndReached={() => {
                if (search.hasNextPage && !search.isFetchingNextPage) {
                    void search.fetchNextPage()
                }
            }}
            loading={
                search.isFetching || (!selectedOptionLoaded && !!selectedId)
            }
            error={!!error || !!fieldState.error}
            validationText={
                (error instanceof Error ? error.message : undefined) ||
                fieldState.error?.message
            }
        />
    )
}
