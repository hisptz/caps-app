import i18n from '@dhis2/d2-i18n'
import {
    Button,
    CircularLoader,
    MultiSelectField,
    MultiSelectOption,
    NoticeBox,
} from '@dhis2/ui'
import React from 'react'
import { useController } from 'react-hook-form'
import type { InstanceDetail, MappingDirection } from '@/capsApi/types'
import { mappingToPullItem } from '@/modules/connected-instances/schemas/mappingsForm'
import {
    useSourceDataItemsById,
    useStagingDataElements,
} from '@/modules/dhis2-instance-pull/hooks/usePullItemQueries'

/**
 * The staging data elements a pull or push step moves, picked from its instance's mappings in
 * that direction (Settings › Connected instances › Mappings). Stored as `handlerConfig.mapped`.
 */
export function MappedItemsField({
    routeCode,
    instance,
    loading,
    direction,
}: {
    routeCode: string
    instance: InstanceDetail | undefined
    loading: boolean
    direction: MappingDirection
}): React.ReactElement {
    const { field, fieldState } = useController({
        name: 'handlerConfig.mapped',
    })
    const selected: string[] = Array.isArray(field.value) ? field.value : []
    const mappings = (instance?.mappings ?? []).filter(
        (m) => m.direction === direction
    )
    const mappedIds = new Set(mappings.map((m) => m.stagingDataElement))
    const stale = selected.filter((id) => !mappedIds.has(id))

    const sourceItems = useSourceDataItemsById(
        routeCode,
        mappings.map(mappingToPullItem)
    )
    const staging = useStagingDataElements([...mappedIds, ...stale])
    const stagingName = (id: string) => staging.data?.get(id)?.name ?? id
    const remoteName = (id: string) =>
        sourceItems.data?.get(id)?.displayName ?? id

    if (loading) {
        return <CircularLoader small />
    }
    if (mappings.length === 0 && stale.length === 0) {
        return (
            <NoticeBox
                title={
                    direction === 'PULL'
                        ? i18n.t('Nothing is mapped to pull from this instance')
                        : i18n.t('Nothing is mapped to push to this instance')
                }
            >
                {i18n.t(
                    'Add mappings under Settings › Connected instances › Mappings, then pick them here.'
                )}
            </NoticeBox>
        )
    }

    return (
        <>
            <MultiSelectField
                label={i18n.t('Data elements')}
                filterable
                clearable
                noMatchText={i18n.t('No mapped data element matches')}
                selected={selected}
                onChange={({ selected: next }: { selected: string[] }) =>
                    field.onChange(next)
                }
                error={Boolean(fieldState.error) || stale.length > 0}
                validationText={
                    stale.length > 0
                        ? i18n.t(
                              'No longer mapped this way, so the step would fail: {{names}}',
                              {
                                  names: stale.map(stagingName).join(', '),
                                  nsSeparator: '~~',
                              }
                          )
                        : fieldState.error?.message
                }
            >
                {mappings.map((m) => (
                    <MultiSelectOption
                        key={m.stagingDataElement}
                        value={m.stagingDataElement}
                        label={
                            direction === 'PULL'
                                ? `${remoteName(m.remoteItem)} → ${stagingName(m.stagingDataElement)}`
                                : `${stagingName(m.stagingDataElement)} → ${remoteName(m.remoteItem)}`
                        }
                    />
                ))}
                {stale.map((id) => (
                    <MultiSelectOption
                        key={id}
                        value={id}
                        label={i18n.t('{{name}} (not mapped)', {
                            name: stagingName(id),
                        })}
                    />
                ))}
            </MultiSelectField>
            {stale.length > 0 && (
                <div>
                    <Button
                        small
                        onClick={() =>
                            field.onChange(
                                selected.filter((id) => mappedIds.has(id))
                            )
                        }
                    >
                        {i18n.t('Take them out of the step')}
                    </Button>
                </div>
            )}
        </>
    )
}
