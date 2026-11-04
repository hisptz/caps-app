import i18n from '@dhis2/d2-i18n'
import { z } from 'zod'
import type {
    InstanceDetail,
    InstanceMapping,
    MappingWithInstance,
    PutInstanceBody,
} from '@/capsApi/types'
import {
    orgUnitMatchSchema,
    type PullItem,
    pullItemSchema,
    pullItemTarget,
} from '@/modules/dhis2-instance-pull/schemas/config'
import {
    type PushItem,
    pushItemSchema,
} from '@/modules/dhis2-instance-push/schemas/config'

/**
 * A connected instance's settings and mappings, split by direction. Each list uses its step's
 * item shape so the steps' row editors can be reused:
 *   - pull: `from` on the instance → `into` on staging (the same ID when left out);
 *   - push: `from` on staging → `into` on the instance (the same ID when left out).
 */
export const mappingsFormSchema = z
    .object({
        orgUnitMatch: orgUnitMatchSchema,
        pull: z.array(pullItemSchema),
        push: z.array(pushItemSchema),
        /** Choices for data elements created on save, keyed by remote item. */
        drafts: z.record(z.string(), z.unknown()).optional(),
    })
    .superRefine((values, ctx) => {
        // Within an instance, each staging data element and each remote item is paired once.
        const rows = [
            ...values.pull.map((item, index) => ({
                list: 'pull' as const,
                index,
                remote: { id: item.from, field: 'from' },
                staging: { id: pullItemTarget(item), field: 'into' },
            })),
            ...values.push.map((item, index) => ({
                list: 'push' as const,
                index,
                remote: { id: item.into ?? item.from, field: 'into' },
                staging: { id: item.from, field: 'from' },
            })),
        ]
        const seen = { remote: new Set<string>(), staging: new Set<string>() }
        const messages = {
            remote: i18n.t('This item on the instance is already mapped'),
            staging: i18n.t('This staging data element is already mapped'),
        }
        for (const row of rows) {
            for (const side of ['remote', 'staging'] as const) {
                const { id, field } = row[side]
                if (!id) {
                    continue
                }
                if (seen[side].has(id)) {
                    ctx.addIssue({
                        code: 'custom',
                        path: [row.list, row.index, field],
                        message: messages[side],
                    })
                }
                seen[side].add(id)
            }
        }
    })

export type MappingsFormValues = z.infer<typeof mappingsFormSchema>

export function mappingToPullItem(mapping: InstanceMapping): PullItem {
    const sameId =
        mapping.remoteItemType === 'DATA_ELEMENT' &&
        mapping.remoteItem === mapping.stagingDataElement
    return {
        from: mapping.remoteItem,
        fromType: mapping.remoteItemType,
        into: sameId ? undefined : mapping.stagingDataElement,
    }
}

export function mappingToPushItem(mapping: InstanceMapping): PushItem {
    return {
        from: mapping.stagingDataElement,
        into:
            mapping.remoteItem === mapping.stagingDataElement
                ? undefined
                : mapping.remoteItem,
    }
}

export function instanceToFormValues(
    instance: InstanceDetail | undefined
): MappingsFormValues {
    const mappings = instance?.mappings ?? []
    return {
        orgUnitMatch: instance?.orgUnitMatch ?? 'id',
        pull: mappings
            .filter((m) => m.direction === 'PULL')
            .map(mappingToPullItem),
        push: mappings
            .filter((m) => m.direction === 'PUSH')
            .map(mappingToPushItem),
        drafts: {},
    }
}

/** Expects every pull row to have its staging data element (created ones included). */
export function formValuesToPutBody(
    values: Pick<MappingsFormValues, 'orgUnitMatch' | 'pull' | 'push'>
): PutInstanceBody {
    return {
        orgUnitMatch: values.orgUnitMatch,
        mappings: [
            ...values.pull.map((item) => ({
                remoteItem: item.from,
                remoteItemType: item.fromType,
                stagingDataElement: pullItemTarget(item) ?? item.from,
                direction: 'PULL' as const,
            })),
            ...values.push.map((item) => ({
                remoteItem: item.into ?? item.from,
                remoteItemType: 'DATA_ELEMENT' as const,
                stagingDataElement: item.from,
                direction: 'PUSH' as const,
            })),
        ],
    }
}

/** Pull rows into a staging data element another instance already pulls into. */
export function rowsTakenByOtherInstances(
    routeCode: string,
    pull: PullItem[],
    mappings: MappingWithInstance[]
): Array<{ index: number; routeCode: string }> {
    const pulledBy = new Map(
        mappings
            .filter((m) => m.direction === 'PULL' && m.routeCode !== routeCode)
            .map((m) => [m.stagingDataElement, m])
    )
    return pull.flatMap((item, index) => {
        const target = pullItemTarget(item)
        const other = target ? pulledBy.get(target) : undefined
        return other ? [{ index, routeCode: other.routeCode }] : []
    })
}

type TakenDetail = { stagingDataElement: string; routeCode: string }
type InUseDetail = { stepName: string; pipelineName: string; missing: string[] }

/** The 409 bodies `PUT /instances/:code` answers with. */
export type SaveInstanceConflict =
    | { kind: 'taken'; taken: TakenDetail[] }
    | { kind: 'in-use'; steps: InUseDetail[] }

export function parseSaveInstanceConflict(
    body: unknown
): SaveInstanceConflict | null {
    if (typeof body !== 'object' || body === null) {
        return null
    }
    const { code, details } = body as {
        code?: string
        details?: { taken?: TakenDetail[]; steps?: InUseDetail[] }
    }
    if (code === 'instance_mapping_conflict' && details?.taken) {
        return { kind: 'taken', taken: details.taken }
    }
    if (code === 'instance_mapping_in_use' && details?.steps) {
        return { kind: 'in-use', steps: details.steps }
    }
    return null
}
