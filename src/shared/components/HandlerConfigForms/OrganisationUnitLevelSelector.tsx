import i18n from '@dhis2/d2-i18n'
import { MultiSelectField, MultiSelectOption } from '@dhis2/ui'
import React, { useMemo } from 'react'
import { useOrganisationUnitLevelOptions } from './useOrganisationUnitLevelOptions'

export type OrganisationUnitLevelSelectorProps = {
    label: string
    selected: string[]
    onChange: (selected: string[]) => void
    helpText?: string
    disabled?: boolean
}

export function OrganisationUnitLevelSelector({
    label,
    selected,
    onChange,
    helpText,
    disabled,
}: OrganisationUnitLevelSelectorProps): React.ReactElement {
    const { options, loading, error, optionValues } =
        useOrganisationUnitLevelOptions()

    const selectedForField = useMemo((): string[] | undefined => {
        if (loading || options.length === 0) {
            return undefined
        }
        return selected.filter((value) => optionValues.has(value))
    }, [loading, options.length, selected, optionValues])

    return (
        <MultiSelectField
            label={label}
            {...(selectedForField !== undefined
                ? { selected: selectedForField }
                : {})}
            disabled={disabled}
            helpText={helpText}
            filterable
            filterPlaceholder={i18n.t('Search organisation unit levels')}
            noMatchText={i18n.t('No matching organisation unit levels found')}
            loading={loading}
            error={!!error}
            validationText={error?.message}
            onChange={({ selected: next }) => onChange(next)}
        >
            {options.map((opt) => (
                <MultiSelectOption
                    key={opt.value}
                    label={opt.label}
                    value={opt.value}
                />
            ))}
        </MultiSelectField>
    )
}
