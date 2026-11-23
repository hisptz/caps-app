import { SimpleSingleSelect } from '@dhis2/ui'
import React, { useMemo, useState } from 'react'
import { filterOptionsByLabel } from './SearchableSimpleSelectField'

export type SingleSelectControlOption = {
    label: string
    value: string
    disabled?: boolean
}

type SimpleSingleSelectRuntimeProps = {
    name: string
    options: SingleSelectControlOption[]
    selected?: SingleSelectControlOption
    onChange: (option: SingleSelectControlOption) => void
    onClear?: () => void
    [prop: string]: unknown
}

const RawSimpleSingleSelect =
    SimpleSingleSelect as unknown as React.FC<SimpleSingleSelectRuntimeProps>

export interface SingleSelectControlProps {
    name: string
    options: SingleSelectControlOption[]
    value: string | null | undefined
    onChange: (value: string) => void
    valueLabel?: string
    placeholder?: string
    disabled?: boolean
    error?: boolean
    loading?: boolean
    clearable?: boolean
    clearText?: string
    filterable?: boolean
    filterPlaceholder?: string
    noMatchText?: string
    dense?: boolean
    className?: string
    /** Id of the element labelling this select. */
    labelledBy?: string
}

export function SingleSelectControl({
    name,
    options,
    value,
    onChange,
    valueLabel,
    clearable,
    filterable,
    ...rest
}: SingleSelectControlProps): React.ReactElement {
    const [search, setSearch] = useState('')
    const visible = useMemo(
        () => (filterable ? filterOptionsByLabel(options, search) : options),
        [filterable, options, search]
    )
    const selectedOption = options.find((option) => option.value === value)
    const selected =
        value !== null && value !== undefined && value !== ''
            ? {
                  value,
                  label: selectedOption?.label ?? valueLabel ?? value,
              }
            : undefined

    return (
        <RawSimpleSingleSelect
            {...rest}
            name={name}
            options={visible}
            selected={selected}
            filterable={filterable}
            filterValue={filterable ? search : undefined}
            onFilterChange={
                filterable
                    ? (next: string | undefined) => setSearch(next ?? '')
                    : undefined
            }
            clearable={clearable}
            onChange={(option) => onChange(option?.value ?? '')}
            onClear={clearable ? () => onChange('') : undefined}
        />
    )
}
