import { useDataQuery } from '@dhis2/app-runtime'
import { useMemo } from 'react'

const query = {
    levels: {
        resource: 'organisationUnitLevels',
        params: {
            fields: 'id,displayName,level',
            order: 'level:asc',
        },
    },
}

export type OrganisationUnitLevelOption = {
    value: string
    label: string
}

export function useOrganisationUnitLevelOptions(): {
    options: OrganisationUnitLevelOption[]
    loading: boolean
    error: Error | undefined
    optionValues: Set<string>
} {
    const { loading, error, data } = useDataQuery<{
        levels: {
            organisationUnitLevels: Array<{
                id: string
                displayName: string
                level: number
            }>
        }
    }>(query)

    const options = useMemo((): OrganisationUnitLevelOption[] => {
        if (!data) {
            return []
        }
        return data.levels.organisationUnitLevels.map((row) => ({
            value: String(row.level),
            label: row.displayName,
        }))
    }, [data])

    const optionValues = useMemo(
        () => new Set(options.map((opt) => opt.value)),
        [options]
    )

    return {
        options,
        loading,
        error: error ?? undefined,
        optionValues,
    }
}
