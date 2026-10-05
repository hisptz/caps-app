import { useDataEngine } from '@dhis2/app-runtime'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { sourceRunResource } from '@/modules/connected-instances/constants'
import type { PullItemType } from '@/modules/dhis2-instance-pull/schemas/config'
import {
    COMBO_FIELDS,
    type ComboMeta,
    toComboMeta,
} from '@/modules/dhis2-instance-pull/utils/categoryCombos'

export type SourceDataItem = {
    id: string
    displayName: string
    dimensionItemType: PullItemType
}

const ITEM_TYPES: PullItemType[] = [
    'DATA_ELEMENT',
    'INDICATOR',
    'PROGRAM_INDICATOR',
]
const TYPE_FILTER = `dimensionItemType:in:[${ITEM_TYPES.join(',')}]`
const PAGE_SIZE = 50

type DataItemsPage = {
    dataItems?: SourceDataItem[]
    pager?: { page: number; pageCount: number }
}

export function useSourceDataItemSearch(
    routeCode: string | undefined,
    keyword: string
) {
    const engine = useDataEngine()
    const trimmed = keyword.trim()
    return useInfiniteQuery({
        queryKey: ['dhis2', 'source-data-items', routeCode, 'search', trimmed],
        enabled: Boolean(routeCode),
        keepPreviousData: true,
        staleTime: 5 * 60_000,
        queryFn: async ({ pageParam = 1 }) => {
            const filter = [TYPE_FILTER]
            if (trimmed) {
                filter.push(`identifiable:token:${trimmed}`)
            }
            const result = (await engine.query({
                items: {
                    resource: sourceRunResource(routeCode!, 'dataItems'),
                    params: {
                        filter,
                        fields: 'id,displayName,dimensionItemType',
                        order: 'displayName:asc',
                        page: pageParam,
                        pageSize: PAGE_SIZE,
                    },
                },
            })) as { items: DataItemsPage }
            return result.items
        },
        getNextPageParam: (last) =>
            last.pager && last.pager.page < last.pager.pageCount
                ? last.pager.page + 1
                : undefined,
    })
}

const TYPED_RESOURCE: Record<PullItemType, string> = {
    DATA_ELEMENT: 'dataElements',
    INDICATOR: 'indicators',
    PROGRAM_INDICATOR: 'programIndicators',
}

export function useSourceDataItemsById(
    routeCode: string | undefined,
    items: ReadonlyArray<{ from?: string; fromType?: PullItemType }>
) {
    const engine = useDataEngine()
    const byType = new Map<PullItemType, string[]>()
    for (const { from, fromType } of items) {
        if (from && fromType) {
            const ids = byType.get(fromType) ?? []
            if (!ids.includes(from)) {
                ids.push(from)
            }
            byType.set(fromType, ids)
        }
    }
    const key = ITEM_TYPES.map((type) => [
        type,
        [...(byType.get(type) ?? [])].sort(),
    ])
    return useQuery({
        queryKey: ['dhis2', 'source-data-items', routeCode, 'ids', key],
        enabled: Boolean(routeCode) && byType.size > 0,
        keepPreviousData: true,
        staleTime: 5 * 60_000,
        queryFn: async () => {
            const types = [...byType.keys()]
            const result = (await engine.query(
                Object.fromEntries(
                    types.map((type) => [
                        type,
                        {
                            resource: sourceRunResource(
                                routeCode!,
                                TYPED_RESOURCE[type]
                            ),
                            params: {
                                filter: `id:in:[${byType.get(type)!.join(',')}]`,
                                fields: 'id,displayName',
                                paging: false,
                            },
                        },
                    ])
                )
            )) as Record<
                string,
                Record<string, Array<{ id: string; displayName: string }>>
            >
            const map = new Map<string, SourceDataItem>()
            for (const type of types) {
                for (const row of result[type]?.[TYPED_RESOURCE[type]] ?? []) {
                    map.set(row.id, { ...row, dimensionItemType: type })
                }
            }
            return map
        },
    })
}

export type DataElementWithCombo = { name: string; combo: ComboMeta }

type ComboRow = {
    id: string
    displayName: string
    categoryCombo?: Parameters<typeof toComboMeta>[0]['categoryCombo']
}

function toDataElementMap(rows: ComboRow[]): Map<string, DataElementWithCombo> {
    return new Map(
        rows.map((row) => [
            row.id,
            { name: row.displayName, combo: toComboMeta(row) },
        ])
    )
}

export function useStagingDataElements(ids: string[]) {
    const engine = useDataEngine()
    const sorted = [...new Set(ids)].sort()
    return useQuery({
        queryKey: ['dhis2', 'staging-data-elements', sorted],
        enabled: sorted.length > 0,
        keepPreviousData: true,
        queryFn: async () => {
            const result = (await engine.query({
                des: {
                    resource: 'dataElements',
                    params: {
                        filter: `id:in:[${sorted.join(',')}]`,
                        fields: COMBO_FIELDS,
                        paging: false,
                    },
                },
            })) as { des: { dataElements: ComboRow[] } }
            return toDataElementMap(result.des.dataElements)
        },
    })
}

/** Category combos of source data elements, read through the route. */
export function useSourceDataElementCombos(
    routeCode: string | undefined,
    ids: string[]
) {
    const engine = useDataEngine()
    const sorted = [...new Set(ids)].sort()
    return useQuery({
        queryKey: ['dhis2', 'source-data-element-combos', routeCode, sorted],
        enabled: Boolean(routeCode) && sorted.length > 0,
        keepPreviousData: true,
        staleTime: 5 * 60_000,
        queryFn: async () => {
            const result = (await engine.query({
                des: {
                    resource: sourceRunResource(routeCode!, 'dataElements'),
                    params: {
                        filter: `id:in:[${sorted.join(',')}]`,
                        fields: COMBO_FIELDS,
                        paging: false,
                    },
                },
            })) as { des: { dataElements?: ComboRow[] } }
            return toDataElementMap(result.des.dataElements ?? [])
        },
    })
}
