import { useDataEngine } from '@dhis2/app-runtime'
import { useQuery } from '@tanstack/react-query'
import { sourceRunResource } from '@/modules/connected-instances/constants'
import { toComboMeta } from '@/modules/dhis2-instance-pull/utils/categoryCombos'
import type { PushMeta } from '@/modules/dhis2-instance-push/utils/pushItemStatus'

export type PushDataElement = { name: string; meta: PushMeta }

const FIELDS =
    'id,displayName,valueType,aggregationType,categoryCombo[name,isDefault,categoryOptionCombos[id,name]]'

type Row = Parameters<typeof toComboMeta>[0] & {
    id: string
    displayName: string
    aggregationType?: string
}

function toMap(rows: Row[]): Map<string, PushDataElement> {
    return new Map(
        rows.map((row) => [
            row.id,
            {
                name: row.displayName,
                meta: {
                    ...toComboMeta(row),
                    aggregationType: row.aggregationType,
                },
            },
        ])
    )
}

/**
 * Data elements by ID, with what the push needs to plan them: on staging when `routeCode` is
 * null, otherwise on the connected instance through its route.
 */
export function usePushDataElements(
    routeCode: string | null | undefined,
    ids: string[]
) {
    const engine = useDataEngine()
    const sorted = [...new Set(ids.filter(Boolean))].sort()
    const onTarget = routeCode !== null
    return useQuery({
        queryKey: ['dhis2', 'push-data-elements', routeCode, sorted],
        enabled: sorted.length > 0 && (!onTarget || Boolean(routeCode)),
        keepPreviousData: true,
        staleTime: onTarget ? 5 * 60_000 : 0,
        queryFn: async () => {
            const result = (await engine.query({
                des: {
                    resource: onTarget
                        ? sourceRunResource(routeCode!, 'dataElements')
                        : 'dataElements',
                    params: {
                        filter: `id:in:[${sorted.join(',')}]`,
                        fields: FIELDS,
                        paging: false,
                    },
                },
            })) as { des: { dataElements?: Row[] } }
            return toMap(result.des.dataElements ?? [])
        },
    })
}
