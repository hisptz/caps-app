import { CAPS_IMPORTED_GROUP_CODE } from '@/modules/connected-instances/constants'
import type {
    CreatedAggregationType,
    PullItem,
    PullItemType,
} from '@/modules/dhis2-instance-pull/schemas/config'

export type SourceItemMeta = {
    id: string
    name: string
    shortName?: string
    code?: string
    valueType?: string
    aggregationType?: string
}

export type PlannedCreation = {
    index: number
    type: PullItemType
    targetId?: string
}

/**
 * Which rows need a staging data element created on save:
 * - data element rows whose target (`into`, else its own ID) isn't on staging;
 * - indicator rows without `into` (they get a new ID);
 * - indicator rows whose `into` is missing (a data element deleted since, or a stale ID) are
 *   not created: the user picked that data element, so it's reported instead.
 */
export function planCreations(
    items: PullItem[],
    existingStagingIds: ReadonlySet<string>
): { creations: PlannedCreation[]; missingTargets: string[] } {
    const creations: PlannedCreation[] = []
    const missingTargets: string[] = []
    items.forEach((item, index) => {
        if (item.fromType === 'DATA_ELEMENT') {
            const target = item.into ?? item.from
            if (existingStagingIds.has(target)) {
                return
            }
            if (item.into && item.into !== item.from) {
                missingTargets.push(item.into)
                return
            }
            creations.push({ index, type: item.fromType, targetId: item.from })
            return
        }
        if (!item.into) {
            creations.push({ index, type: item.fromType })
        } else if (!existingStagingIds.has(item.into)) {
            missingTargets.push(item.into)
        }
    })
    return { creations, missingTargets }
}

const SHORT_NAME_MAX = 50
const WRITABLE_AGGREGATION_TYPES = new Set([
    'SUM',
    'AVERAGE',
    'AVERAGE_SUM_ORG_UNIT',
    'LAST',
    'LAST_AVERAGE_ORG_UNIT',
    'FIRST',
    'COUNT',
    'MIN',
    'MAX',
])

function aggregationFor(
    type: PullItemType,
    source: SourceItemMeta,
    chosen: CreatedAggregationType | undefined
): string {
    if (type === 'INDICATOR') {
        return chosen ?? 'AVERAGE'
    }
    if (chosen) {
        return chosen
    }
    const fromSource = source.aggregationType?.toUpperCase()
    return fromSource && WRITABLE_AGGREGATION_TYPES.has(fromSource)
        ? fromSource
        : 'SUM'
}

export type CreationInput = {
    type: PullItemType
    targetId: string
    source: SourceItemMeta
    aggregationType?: CreatedAggregationType
}

export type MetadataPlan = {
    metadata: {
        dataElements: Array<Record<string, unknown>>
        dataElementGroups?: Array<Record<string, unknown>>
    }
    /** Data elements to add to the existing CAPS imported group, when it already exists. */
    groupAdditions: string[]
}

export function buildMetadataPayload({
    creations,
    group,
}: {
    creations: CreationInput[]
    group: {
        existingId?: string
        newId?: string
        name: string
        shortName: string
    }
}): MetadataPlan {
    const dataElements = creations.map(
        ({ type, targetId, source, aggregationType }) => {
            const isDataElement = type === 'DATA_ELEMENT'
            const shortName = (source.shortName || source.name).slice(
                0,
                SHORT_NAME_MAX
            )
            return {
                id: targetId,
                name: source.name,
                shortName,
                ...(isDataElement && source.code ? { code: source.code } : {}),
                valueType: isDataElement
                    ? (source.valueType ?? 'NUMBER')
                    : 'NUMBER',
                aggregationType: aggregationFor(type, source, aggregationType),
                domainType: 'AGGREGATE',
                zeroIsSignificant: false,
            }
        }
    )
    const ids = dataElements.map(({ id }) => ({ id }))

    if (group.existingId) {
        return {
            metadata: { dataElements },
            groupAdditions: ids.map(({ id }) => id),
        }
    }
    if (!group.newId) {
        throw new Error(
            'A new group ID is required when the group does not exist'
        )
    }
    return {
        metadata: {
            dataElements,
            dataElementGroups: [
                {
                    id: group.newId,
                    code: CAPS_IMPORTED_GROUP_CODE,
                    name: group.name,
                    shortName: group.shortName,
                    dataElements: ids,
                },
            ],
        },
        groupAdditions: [],
    }
}
