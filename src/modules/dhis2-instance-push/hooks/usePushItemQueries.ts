import { useDataEngine } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import { useQuery } from '@tanstack/react-query'
import { useCallback } from 'react'
import { sourceRunResource } from '@/modules/connected-instances/constants'
import { toComboMeta } from '@/modules/dhis2-instance-pull/utils/categoryCombos'
import type { PushItem } from '@/modules/dhis2-instance-push/schemas/config'
import {
    type PushMeta,
    pushItemStatus,
} from '@/modules/dhis2-instance-push/utils/pushItemStatus'

type Engine = ReturnType<typeof useDataEngine>

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

/** On staging when `routeCode` is null, otherwise on the connected instance through its route. */
async function fetchPushDataElements(
    engine: Engine,
    routeCode: string | null,
    ids: string[]
): Promise<Map<string, PushDataElement>> {
    const result = (await engine.query({
        des: {
            resource:
                routeCode !== null
                    ? sourceRunResource(routeCode, 'dataElements')
                    : 'dataElements',
            params: {
                filter: `id:in:[${ids.join(',')}]`,
                fields: FIELDS,
                paging: false,
            },
        },
    })) as { des: { dataElements?: Row[] } }
    return toMap(result.des.dataElements ?? [])
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
        queryFn: () =>
            fetchPushDataElements(engine, onTarget ? routeCode! : null, sorted),
    })
}

export class PushTargetsError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'PushTargetsError'
    }
}

/**
 * The checks the engine runs before pushing, for a connected instance's push mappings: both
 * data elements exist, and the staging values fit the target (value type, categories).
 */
export function useVerifyPushTargets() {
    const engine = useDataEngine()
    return useCallback(
        async (routeCode: string, items: PushItem[]): Promise<void> => {
            const targetOf = (item: PushItem) => item.into ?? item.from
            const staging = await fetchPushDataElements(engine, null, [
                ...new Set(items.map((item) => item.from)),
            ])
            let target: Map<string, PushDataElement>
            try {
                target = await fetchPushDataElements(engine, routeCode, [
                    ...new Set(items.map(targetOf)),
                ])
            } catch {
                throw new PushTargetsError(
                    i18n.t(
                        'Could not read the data elements on this instance to check the push mappings.'
                    )
                )
            }
            const problems = items.flatMap((item) => {
                const from = staging.get(item.from)
                const to = target.get(targetOf(item))
                if (!from) {
                    return [
                        i18n.t('{{id}} doesn’t exist on staging', {
                            id: item.from,
                        }),
                    ]
                }
                if (!to) {
                    return [
                        i18n.t('{{id}} doesn’t exist on this instance', {
                            id: targetOf(item),
                        }),
                    ]
                }
                const status = pushItemStatus(from.meta, to.meta)
                return status.kind === 'problem'
                    ? [`${from.name} → ${to.name}: ${status.message}`]
                    : []
            })
            if (problems.length > 0) {
                throw new PushTargetsError(
                    i18n.t('Some push mappings can’t work: {{problems}}', {
                        problems: problems.join('; '),
                        nsSeparator: '~~',
                    })
                )
            }
        },
        [engine]
    )
}
