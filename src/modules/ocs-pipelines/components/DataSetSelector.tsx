import { useDataEngine } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import { SimpleSingleSelectField } from '@dhis2/ui'
import { useQuery } from '@tanstack/react-query'
import React, { useMemo, useState } from 'react'
import { useController } from 'react-hook-form'
import { useDebounceValue } from 'usehooks-ts'
import { dataItemOptionComponent } from '@/shared/components/HandlerConfigForms/DataItemOption'

type DataSetRow = { id: string; displayName: string }

const FIELDS = 'id,displayName'

/** A data set of this DHIS2: search by name, or paste a UID. Optional, so it clears. */
export function DataSetSelector({
    name,
    label,
}: {
    name: string
    label: string
}): React.ReactElement {
    const engine = useDataEngine()
    const { field, fieldState } = useController({ name })
    const [keyword, setKeyword] = useState('')
    const [searched] = useDebounceValue(keyword.trim(), 400)
    const selectedId =
        typeof field.value === 'string' && field.value ? field.value : undefined

    const search = useQuery({
        queryKey: ['dhis2', 'data-set-selector', searched],
        staleTime: 60_000,
        queryFn: async () => {
            const result = (await engine.query({
                list: {
                    resource: 'dataSets',
                    params: {
                        fields: FIELDS,
                        filter: searched
                            ? [`identifiable:token:${searched}`]
                            : [],
                        order: 'displayName:asc',
                        pageSize: 50,
                    },
                },
            })) as { list: { dataSets: DataSetRow[] } }
            return result.list.dataSets
        },
    })

    // The saved value may not be in the first page; look it up on its own.
    const selected = useQuery({
        queryKey: ['dhis2', 'data-set-selector', 'id', selectedId],
        enabled: Boolean(selectedId),
        staleTime: 60_000,
        queryFn: async () => {
            const result = (await engine.query({
                list: {
                    resource: 'dataSets',
                    params: {
                        fields: FIELDS,
                        filter: [`id:eq:${selectedId}`],
                        paging: false,
                    },
                },
            })) as { list: { dataSets: DataSetRow[] } }
            return result.list.dataSets
        },
    })

    const options = useMemo(() => {
        const rows = new Map<string, DataSetRow>()
        for (const row of [...(selected.data ?? []), ...(search.data ?? [])]) {
            rows.set(row.id, row)
        }
        return [...rows.values()].map((row) => ({
            value: row.id,
            label: row.displayName,
            component: dataItemOptionComponent('DATA_SET'),
        }))
    }, [search.data, selected.data])

    const loaded =
        !selectedId || options.some((option) => option.value === selectedId)
    const error = search.error ?? selected.error

    return (
        <SimpleSingleSelectField
            name={name}
            label={label}
            value={loaded ? (field.value ?? undefined) : undefined}
            onChange={(value: string) => field.onChange(value || '')}
            options={options}
            clearable
            clearText={i18n.t('Clear')}
            filterable
            filterValue={keyword}
            filterPlaceholder={i18n.t('Search by name or id')}
            noMatchText={i18n.t('No matching data sets')}
            onFilterChange={(next: string | undefined) =>
                setKeyword(next ?? '')
            }
            loading={search.isFetching || (!loaded && Boolean(selectedId))}
            error={Boolean(error) || Boolean(fieldState.error)}
            validationText={
                (error instanceof Error ? error.message : undefined) ||
                fieldState.error?.message
            }
        />
    )
}
