import { useDataQuery } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import { MultiSelectField, MultiSelectOption } from '@dhis2/ui'
import React, { useMemo } from 'react'

const query = {
    userGroups: {
        resource: 'userGroups',
        params: {
            fields: 'id,displayName',
            order: 'displayName:asc',
            paging: false,
        },
    },
}

type UserGroupsResponse = {
    userGroups: {
        userGroups: Array<{ id: string; displayName: string }>
    }
}

export type UserGroupSelectorProps = {
    label: string
    selected: string[]
    onChange: (selected: string[]) => void
    helpText?: string
    validationText?: string
    required?: boolean
}

export function UserGroupSelector({
    label,
    selected,
    onChange,
    helpText,
    validationText,
    required,
}: UserGroupSelectorProps): React.ReactElement {
    const { loading, error, data } = useDataQuery<UserGroupsResponse>(query)
    const groups = useMemo(() => data?.userGroups.userGroups ?? [], [data])

    // MultiSelect throws on selected values without a matching option.
    const selectedForField = useMemo((): string[] | undefined => {
        if (loading || groups.length === 0) {
            return undefined
        }
        const known = new Set(groups.map((g) => g.id))
        return selected.filter((id) => known.has(id))
    }, [groups, loading, selected])

    return (
        <MultiSelectField
            label={label}
            {...(selectedForField !== undefined
                ? { selected: selectedForField }
                : {})}
            required={required}
            helpText={helpText}
            filterable
            clearable
            filterPlaceholder={i18n.t('Search user groups')}
            noMatchText={i18n.t('No matching user groups found')}
            loading={loading}
            error={Boolean(error) || Boolean(validationText)}
            validationText={error?.message ?? validationText}
            onChange={({ selected: next }) => onChange(next)}
        >
            {groups.map((group) => (
                <MultiSelectOption
                    key={group.id}
                    label={group.displayName}
                    value={group.id}
                />
            ))}
        </MultiSelectField>
    )
}
