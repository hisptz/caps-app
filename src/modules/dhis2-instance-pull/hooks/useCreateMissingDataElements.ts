import { useDataEngine } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import { useCallback } from 'react'
import {
    CAPS_IMPORTED_GROUP_CODE,
    sourceRunResource,
} from '@/modules/connected-instances/constants'
import { dhis2ErrorMessage } from '@/modules/connected-instances/utils/dhis2ErrorMessage'
import type {
    CreatedAggregationType,
    Dhis2InstancePullConfigValue,
    PullItem,
    PullItemType,
} from '@/modules/dhis2-instance-pull/schemas/config'
import {
    buildMetadataPayload,
    planCreations,
    type SourceItemMeta,
} from '@/modules/dhis2-instance-pull/utils/buildMetadataPayload'
import {
    COMBO_FIELDS,
    type ComboMeta,
    itemComboStatus,
    toComboMeta,
} from '@/modules/dhis2-instance-pull/utils/categoryCombos'

type Engine = ReturnType<typeof useDataEngine>

/** Per source item choices that aren't part of the saved step config. */
export type InstancePullDrafts = Record<
    string,
    { aggregationType?: CreatedAggregationType }
>

export class CreateMissingDataElementsError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'CreateMissingDataElementsError'
    }
}

const SOURCE_RESOURCE: Record<PullItemType, string> = {
    DATA_ELEMENT: 'dataElements',
    INDICATOR: 'indicators',
    PROGRAM_INDICATOR: 'programIndicators',
}

const SOURCE_FIELDS: Record<PullItemType, string> = {
    DATA_ELEMENT: 'id,name,shortName,code,valueType,aggregationType',
    INDICATOR: 'id,name,shortName',
    PROGRAM_INDICATOR: 'id,name,shortName,aggregationType',
}

async function findExistingDataElements(
    engine: Engine,
    ids: string[]
): Promise<Set<string>> {
    if (ids.length === 0) {
        return new Set()
    }
    const result = (await engine.query({
        des: {
            resource: 'dataElements',
            params: {
                filter: `id:in:[${ids.join(',')}]`,
                fields: 'id',
                paging: false,
            },
        },
    })) as { des: { dataElements: Array<{ id: string }> } }
    return new Set(result.des.dataElements.map(({ id }) => id))
}

async function readSourceItem(
    engine: Engine,
    routeCode: string,
    item: PullItem
): Promise<SourceItemMeta> {
    try {
        const result = (await engine.query({
            item: {
                resource: sourceRunResource(
                    routeCode,
                    `${SOURCE_RESOURCE[item.fromType]}/${item.from}`
                ),
                params: { fields: SOURCE_FIELDS[item.fromType] },
            },
        })) as { item: SourceItemMeta }
        return result.item
    } catch (err) {
        throw new CreateMissingDataElementsError(
            i18n.t(
                'Could not read {{id}} from the source instance: {{message}}',
                {
                    id: item.from,
                    message: dhis2ErrorMessage(err, i18n.t('request failed')),
                }
            )
        )
    }
}

async function generateIds(engine: Engine, count: number): Promise<string[]> {
    if (count === 0) {
        return []
    }
    const result = (await engine.query({
        ids: { resource: 'system/id', params: { limit: count } },
    })) as { ids: { codes: string[] } }
    return result.ids.codes
}

type ImportReport = {
    status?: string
    response?: { status?: string }
}

export function useCreateMissingDataElements() {
    const engine = useDataEngine()

    return useCallback(
        async (
            config: Dhis2InstancePullConfigValue,
            drafts: InstancePullDrafts = {}
        ): Promise<{
            config: Dhis2InstancePullConfigValue
            created: number
        }> => {
            const targets = config.items.flatMap((item) =>
                item.into
                    ? [item.into]
                    : item.fromType === 'DATA_ELEMENT'
                      ? [item.from]
                      : []
            )
            const existing = await findExistingDataElements(engine, [
                ...new Set(targets),
            ])
            const { creations, missingTargets } = planCreations(
                config.items,
                existing
            )

            if (missingTargets.length > 0) {
                throw new CreateMissingDataElementsError(
                    i18n.t(
                        'These destination data elements no longer exist: {{ids}}. Pick another data element for those rows.',
                        { ids: missingTargets.join(', ') }
                    )
                )
            }
            if (creations.length === 0) {
                return { config, created: 0 }
            }

            const sources = await Promise.all(
                creations.map(({ index }) =>
                    readSourceItem(
                        engine,
                        config.routeCode,
                        config.items[index]
                    )
                )
            )

            const groupResult = (await engine.query({
                groups: {
                    resource: 'dataElementGroups',
                    params: {
                        filter: `code:eq:${CAPS_IMPORTED_GROUP_CODE}`,
                        fields: 'id',
                        paging: false,
                    },
                },
            })) as { groups: { dataElementGroups: Array<{ id: string }> } }
            const existingGroupId = groupResult.groups.dataElementGroups[0]?.id

            const needNewIds = creations.filter((c) => !c.targetId).length
            const newIds = await generateIds(
                engine,
                needNewIds + (existingGroupId ? 0 : 1)
            )
            const newGroupId = existingGroupId ? undefined : newIds.pop()

            const items = config.items.map((item) => ({ ...item }))
            const inputs = creations.map((creation, i) => {
                const targetId = creation.targetId ?? newIds.shift()!
                if (!creation.targetId) {
                    items[creation.index].into = targetId
                }
                return {
                    type: creation.type,
                    targetId,
                    source: sources[i],
                    // Only indicator rows offer a choice; the rest keep the source's own.
                    aggregationType:
                        creation.type === 'INDICATOR'
                            ? drafts[config.items[creation.index].from]
                                  ?.aggregationType
                            : undefined,
                }
            })

            const plan = buildMetadataPayload({
                creations: inputs,
                group: {
                    existingId: existingGroupId,
                    newId: newGroupId,
                    name: i18n.t('[CAPS] Imported from other instances'),
                    shortName: i18n.t('CAPS imported'),
                },
            })

            const importError = (message: string) => {
                const hint = message.includes('already exists')
                    ? ` ${i18n.t(
                          'If destination already has this data element, use “Write into a different data element” on that row.'
                      )}`
                    : ''
                return new CreateMissingDataElementsError(
                    i18n.t(
                        'Destination refused to create the data elements: {{message}}',
                        { message }
                    ) + hint
                )
            }

            let report: ImportReport
            try {
                report = (await engine.mutate({
                    type: 'create',
                    resource: 'metadata',
                    params: { importStrategy: 'CREATE', atomicMode: 'ALL' },
                    data: plan.metadata,
                })) as ImportReport
            } catch (err) {
                throw importError(
                    dhis2ErrorMessage(
                        err,
                        i18n.t(
                            'check that you may add data elements and data element groups'
                        )
                    )
                )
            }
            const status = report.status ?? report.response?.status
            if (status === 'ERROR') {
                throw importError(
                    dhis2ErrorMessage(
                        { details: report },
                        i18n.t('the metadata import failed')
                    )
                )
            }

            if (existingGroupId && plan.groupAdditions.length > 0) {
                try {
                    await engine.mutate({
                        type: 'create',
                        resource: `dataElementGroups/${existingGroupId}/dataElements`,
                        data: {
                            additions: plan.groupAdditions.map((id) => ({
                                id,
                            })),
                        },
                    })
                } catch (err) {
                    throw new CreateMissingDataElementsError(
                        i18n.t(
                            'The data elements were created, but could not be added to the CAPS imported group: {{message}}',
                            {
                                message: dhis2ErrorMessage(
                                    err,
                                    i18n.t('request failed')
                                ),
                            }
                        )
                    )
                }
            }

            return { config: { ...config, items }, created: inputs.length }
        },
        [engine]
    )
}

async function readCategoryCombos(
    engine: Engine,
    resource: string,
    ids: string[]
): Promise<Map<string, ComboMeta>> {
    if (ids.length === 0) {
        return new Map()
    }
    const result = (await engine.query({
        des: {
            resource,
            params: {
                filter: `id:in:[${[...new Set(ids)].join(',')}]`,
                fields: COMBO_FIELDS,
                paging: false,
            },
        },
    })) as {
        des: {
            dataElements?: Array<
                { id: string } & Parameters<typeof toComboMeta>[0]
            >
        }
    }
    return new Map(
        (result.des.dataElements ?? []).map((de) => [de.id, toComboMeta(de)])
    )
}

export function useVerifyPullTargets() {
    const engine = useDataEngine()

    return useCallback(
        async (config: Dhis2InstancePullConfigValue): Promise<void> => {
            const targets = config.items.flatMap((item) =>
                item.into
                    ? [item.into]
                    : item.fromType === 'DATA_ELEMENT'
                      ? [item.from]
                      : []
            )
            const existing = await findExistingDataElements(engine, [
                ...new Set(targets),
            ])
            const { creations, missingTargets } = planCreations(
                config.items,
                existing
            )
            if (creations.length > 0) {
                throw new CreateMissingDataElementsError(
                    i18n.t(
                        'Pick a destination data element for every item. These have none yet: {{ids}}',
                        {
                            ids: creations
                                .map(({ index }) => config.items[index].from)
                                .join(', '),
                        }
                    )
                )
            }
            if (missingTargets.length > 0) {
                throw new CreateMissingDataElementsError(
                    i18n.t(
                        'These destination data elements no longer exist: {{ids}}. Pick another data element for those rows.',
                        { ids: missingTargets.join(', ') }
                    )
                )
            }

            // The same option combo and value type checks the engine runs before pulling.
            const stagingCombos = await readCategoryCombos(
                engine,
                'dataElements',
                targets
            )
            const needsSource = config.items.filter(
                (item) => item.fromType === 'DATA_ELEMENT'
            )
            let sourceCombos: Map<string, ComboMeta>
            try {
                sourceCombos = await readCategoryCombos(
                    engine,
                    sourceRunResource(config.routeCode, 'dataElements'),
                    needsSource.map((item) => item.from)
                )
            } catch (err) {
                throw new CreateMissingDataElementsError(
                    i18n.t(
                        'Could not read the source’s data elements to check option combos: {{message}}',
                        {
                            message: dhis2ErrorMessage(
                                err,
                                i18n.t('request failed')
                            ),
                        }
                    )
                )
            }
            const blocked = config.items.filter((item) => {
                const status = itemComboStatus(
                    item,
                    sourceCombos.get(item.from),
                    stagingCombos.get(item.into ?? item.from)
                )
                return (
                    status.kind === 'problem' ||
                    (status.kind === 'combos' && status.unmatched.length > 0) ||
                    (status.kind === 'unknown' &&
                        item.fromType === 'DATA_ELEMENT' &&
                        stagingCombos.get(item.into ?? item.from)?.isDefault ===
                            false)
                )
            })
            if (blocked.length > 0) {
                throw new CreateMissingDataElementsError(
                    i18n.t(
                        'These items can’t be written into their destination data elements: {{ids}}. Each item says why; pick another destination data element, or fix it on destination instance.',
                        { ids: blocked.map((item) => item.from).join(', ') }
                    )
                )
            }
        },
        [engine]
    )
}
