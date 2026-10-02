import i18n from '@dhis2/d2-i18n'
import { SimpleSingleSelectField } from '@dhis2/ui'
import React, { useMemo, useState } from 'react'
import { useDebounceValue } from 'usehooks-ts'
import {
    type SourceDataItem,
    useSourceDataItemSearch,
} from '@/modules/dhis2-instance-pull/hooks/usePullItemQueries'
import type { PullItemType } from '@/modules/dhis2-instance-pull/schemas/config'

export function itemTypeLabel(type: PullItemType): string {
    switch (type) {
        case 'DATA_ELEMENT':
            return i18n.t('Data element')
        case 'INDICATOR':
            return i18n.t('Indicator')
        case 'PROGRAM_INDICATOR':
            return i18n.t('Program indicator')
    }
}

function optionLabel(item: SourceDataItem): string {
    return `${item.displayName} · ${itemTypeLabel(item.dimensionItemType)}`
}

export function SourceItemSelector({
    routeCode,
    value,
    selected,
    onSelect,
    error,
    validationText,
    resolving = false,
}: {
    routeCode: string | undefined
    value: string | undefined
    selected: SourceDataItem | undefined
    onSelect: (item: SourceDataItem) => void
    error?: boolean
    validationText?: string
    /** The saved item's name is still being looked up. */
    resolving?: boolean
}): React.ReactElement {
    const [keyword, setKeyword] = useState('')
    const [searched] = useDebounceValue(keyword, 400)
    const search = useSourceDataItemSearch(routeCode, searched)

    const byId = useMemo(() => {
        const map = new Map<string, SourceDataItem>()
        if (selected) {
            map.set(selected.id, selected)
        }
        for (const item of search.data ?? []) {
            map.set(item.id, item)
        }
        return map
    }, [search.data, selected])

    const options = useMemo(() => {
        const list = [...byId.values()].map((item) => ({
            value: item.id,
            label: optionLabel(item),
        }))
        if (value && !byId.has(value)) {
            list.unshift({
                value,
                label: resolving ? i18n.t('Loading…') : value,
            })
        }
        return list
    }, [byId, value, resolving])

    return (
        <SimpleSingleSelectField
            name="source-item"
            dense
            label={i18n.t('Source')}
            value={value}
            options={options}
            filterable
            filterValue={keyword}
            filterPlaceholder={i18n.t('Search by name, code or ID')}
            onFilterChange={(next) => setKeyword(next ?? '')}
            noMatchText={
                search.isError
                    ? i18n.t('The source instance could not be searched')
                    : i18n.t('No matching data items')
            }
            loading={search.isFetching || (resolving && !byId.has(value ?? ''))}
            disabled={!routeCode}
            onChange={(id) => {
                const item = byId.get(String(id))
                if (item) {
                    onSelect(item)
                }
            }}
            error={error || search.isError}
            validationText={
                search.isError
                    ? i18n.t(
                          'Searching the source instance failed. Test the connection in Settings.'
                      )
                    : validationText
            }
        />
    )
}
