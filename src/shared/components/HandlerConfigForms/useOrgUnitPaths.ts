import { useDataQuery } from '@dhis2/app-runtime'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export type SelectorOrgUnit = {
    id: string
    path?: string
    displayName?: string
    children: never[]
}

type OrgUnitMeta = { path?: string; displayName?: string }

const query = {
    orgUnits: {
        resource: 'organisationUnits',
        params: ({ ids }: Record<string, unknown>) => ({
            filter: `id:in:[${(ids as string[]).join(',')}]`,
            fields: 'id,path,displayName',
            paging: false,
        }),
    },
}

type QueryResult = {
    orgUnits: {
        organisationUnits: Array<{
            id: string
            path: string
            displayName: string
        }>
    }
}

export function useOrgUnitPaths(ids: string[]): {
    orgUnits: SelectorOrgUnit[]
    rememberSelection: (
        units: Array<{ id: string; path?: string; displayName?: string }>
    ) => void
} {
    const [metaById, setMetaById] = useState<Record<string, OrgUnitMeta>>({})
    const requestedRef = useRef<Set<string>>(new Set())
    const { data, refetch } = useDataQuery<QueryResult>(query, {
        lazy: true,
    })

    const unresolvedIds = useMemo(
        () =>
            ids.filter(
                (id) => !metaById[id]?.path && !requestedRef.current.has(id)
            ),
        [ids, metaById]
    )

    useEffect(() => {
        if (unresolvedIds.length === 0) {
            return
        }
        unresolvedIds.forEach((id) => requestedRef.current.add(id))
        void refetch({ ids: unresolvedIds })
    }, [unresolvedIds, refetch])

    useEffect(() => {
        const fetched = data?.orgUnits?.organisationUnits
        if (!fetched?.length) {
            return
        }
        setMetaById((current) => {
            const next = { ...current }
            for (const unit of fetched) {
                next[unit.id] = {
                    path: unit.path,
                    displayName: unit.displayName,
                }
            }
            return next
        })
    }, [data])

    const rememberSelection = useCallback(
        (units: Array<{ id: string; path?: string; displayName?: string }>) => {
            const withPath = units.filter((unit) => unit.path)
            if (withPath.length === 0) {
                return
            }
            setMetaById((current) => {
                const next = { ...current }
                for (const unit of withPath) {
                    next[unit.id] = {
                        path: unit.path,
                        displayName: unit.displayName,
                    }
                }
                return next
            })
        },
        []
    )

    const orgUnits = useMemo(
        (): SelectorOrgUnit[] =>
            ids.map((id) => ({
                id,
                path: metaById[id]?.path,
                displayName: metaById[id]?.displayName,
                children: [],
            })),
        [ids, metaById]
    )

    return { orgUnits, rememberSelection }
}
