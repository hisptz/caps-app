import { useDataQuery } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import { Chip, Field, InputField, Menu, MenuItem } from '@dhis2/ui'
import React, { useEffect, useMemo, useState } from 'react'
import classes from './UserSelector.module.css'

const SEARCH_DEBOUNCE_MS = 300
const MIN_SEARCH_LENGTH = 2
const MAX_RESULTS = 10

type UserRow = { id: string; displayName: string; username?: string }
type UsersResponse = { users: { users: UserRow[] } }

const searchQuery = {
    users: {
        resource: 'users',
        params: ({ term }: Record<string, unknown>) => ({
            query: String(term),
            fields: 'id,displayName,username',
            order: 'displayName:asc',
            pageSize: MAX_RESULTS,
        }),
    },
}

const namesQuery = {
    users: {
        resource: 'users',
        params: ({ ids }: Record<string, unknown>) => ({
            filter: `id:in:[${(ids as string[]).join(',')}]`,
            fields: 'id,displayName,username',
            paging: false,
        }),
    },
}

export type UserSelectorProps = {
    label: string
    selected: string[]
    onChange: (selected: string[]) => void
    helpText?: string
    validationText?: string
}

/**
 * Picks individual DHIS2 users with a server-side search, so it stays usable on instances
 * with many users.
 */
export function UserSelector({
    label,
    selected,
    onChange,
    helpText,
    validationText,
}: UserSelectorProps): React.ReactElement {
    const [term, setTerm] = useState('')

    const search = useDataQuery<UsersResponse>(searchQuery, { lazy: true })
    const names = useDataQuery<UsersResponse>(namesQuery, { lazy: true })
    const { refetch: refetchSearch } = search
    const { refetch: refetchNames } = names

    const trimmed = term.trim()
    const searching = trimmed.length >= MIN_SEARCH_LENGTH

    useEffect(() => {
        if (!searching) {
            return
        }
        const timer = setTimeout(
            () => refetchSearch({ term: trimmed }),
            SEARCH_DEBOUNCE_MS
        )
        return () => clearTimeout(timer)
    }, [refetchSearch, searching, trimmed])

    const selectedKey = selected.join(',')
    useEffect(() => {
        if (selectedKey) {
            refetchNames({ ids: selectedKey.split(',') })
        }
    }, [refetchNames, selectedKey])

    const nameById = useMemo(() => {
        const map = new Map<string, string>()
        for (const user of names.data?.users.users ?? []) {
            map.set(user.id, user.displayName)
        }
        return map
    }, [names.data])

    const results = useMemo(
        () =>
            (search.data?.users.users ?? []).filter(
                (user) => !selected.includes(user.id)
            ),
        [search.data, selected]
    )

    function add(user: UserRow) {
        onChange([...selected, user.id])
        setTerm('')
    }

    return (
        <Field
            label={label}
            helpText={helpText}
            error={Boolean(validationText)}
            validationText={validationText}
        >
            {selected.length > 0 && (
                <div className={classes.chips}>
                    {selected.map((id) => (
                        <Chip
                            key={id}
                            dense
                            onRemove={() =>
                                onChange(selected.filter((s) => s !== id))
                            }
                        >
                            {nameById.get(id) ?? id}
                        </Chip>
                    ))}
                </div>
            )}
            <InputField
                dense
                placeholder={i18n.t('Search users by name or username')}
                value={term}
                onChange={({ value }) => setTerm(value ?? '')}
                loading={searching && search.loading}
            />
            {searching && !search.loading && search.called && (
                <div className={classes.results}>
                    {search.error ? (
                        <p className={classes.message}>
                            {search.error.message}
                        </p>
                    ) : results.length === 0 ? (
                        <p className={classes.message}>
                            {i18n.t('No matching users found')}
                        </p>
                    ) : (
                        <Menu dense>
                            {results.map((user) => (
                                <MenuItem
                                    key={user.id}
                                    dense
                                    label={
                                        user.username
                                            ? `${user.displayName} (${user.username})`
                                            : user.displayName
                                    }
                                    onClick={() => add(user)}
                                />
                            ))}
                        </Menu>
                    )}
                </div>
            )}
        </Field>
    )
}
