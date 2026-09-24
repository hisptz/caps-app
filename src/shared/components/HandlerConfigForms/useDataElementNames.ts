import { useDataQuery } from '@dhis2/app-runtime'
import { useEffect, useMemo } from 'react'

type DataElementRow = { id: string; displayName: string }

type NamesResponse = {
    de: { dataElements?: DataElementRow[] }
}

const namesQuery = {
    de: {
        resource: 'dataElements',
        params: ({ ids }: { ids?: string[] }) => ({
            fields: 'id,displayName',
            filter: ids?.length ? [`id:in:[${ids.join(',')}]`] : undefined,
            paging: false,
        }),
    },
}

/**
 * Resolves data element UIDs to their display names, so configuration summaries can show
 * what a user recognises instead of an eleven-character id.
 */
export function useDataElementNames(ids: string[]): Record<string, string> {
    const unique = useMemo(
        () => Array.from(new Set(ids.filter(Boolean))),
        [ids]
    )
    const key = unique.join(',')
    const { data, refetch } = useDataQuery<NamesResponse>(namesQuery, {
        lazy: true,
    })

    useEffect(() => {
        if (unique.length > 0) {
            void refetch({ ids: unique })
        }
    }, [key])

    return useMemo(() => {
        const rows = data?.de?.dataElements ?? []
        return Object.fromEntries(
            rows.map((row): [string, string] => [row.id, row.displayName])
        )
    }, [data])
}
