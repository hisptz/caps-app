import i18n from '@dhis2/d2-i18n'
import { SimpleSingleSelectField } from '@dhis2/ui'
import React, { useMemo, useState } from 'react'

type SimpleSingleSelectFieldProps = React.ComponentProps<
    typeof SimpleSingleSelectField
>

type Option = { label: string; value: string }

export type SearchableSimpleSelectFieldProps = Omit<
    SimpleSingleSelectFieldProps,
    'filterable' | 'filterValue' | 'onFilterChange' | 'options'
> & {
    options: Option[]
}

/** Keeps the options whose label contains the search text, ignoring case. */
export function filterOptionsByLabel<T extends Option>(
    options: T[],
    search: string
): T[] {
    const needle = search.trim().toLowerCase()
    if (!needle) {
        return options
    }
    return options.filter((option) =>
        option.label.toLowerCase().includes(needle)
    )
}

export function SearchableSimpleSelectField({
    options,
    value,
    valueLabel,
    filterPlaceholder,
    noMatchText,
    ...rest
}: SearchableSimpleSelectFieldProps): React.ReactElement {
    const [search, setSearch] = useState('')
    const visible = useMemo(
        () => filterOptionsByLabel(options, search),
        [options, search]
    )
    const selectedLabel =
        options.find((option) => option.value === value)?.label ?? valueLabel

    return (
        <SimpleSingleSelectField
            {...rest}
            value={value}
            valueLabel={selectedLabel}
            options={visible}
            filterable
            filterValue={search}
            filterPlaceholder={filterPlaceholder ?? i18n.t('Type to search')}
            noMatchText={noMatchText ?? i18n.t('No options match')}
            onFilterChange={(next: string | undefined) => setSearch(next ?? '')}
        />
    )
}
