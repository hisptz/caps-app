import i18n from '@dhis2/d2-i18n'
import { Button, CircularLoader, IconDelete16, Tag } from '@dhis2/ui'
import React, { useState } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { DataElementSelector } from '../DataElementSelector'
import classes from '../Dhis2InstancePullConfig/Dhis2InstancePullConfig.module.css'
import { SourceItemSelector } from '../Dhis2InstancePullConfig/SourceItemSelector'
import type { PushDataElement } from '@/modules/dhis2-instance-push/hooks/usePushItemQueries'
import type {
    PushItem,
    PushSource,
} from '@/modules/dhis2-instance-push/schemas/config'
import {
    type PushItemStatus,
    pushItemStatus,
} from '@/modules/dhis2-instance-push/utils/pushItemStatus'

const DATA_ELEMENTS_ONLY = ['DATA_ELEMENT'] as const

/** Only shown when there is something to say; values that go as they are need no note. */
function Breakdown({
    status,
}: {
    status: PushItemStatus
}): React.ReactElement | null {
    switch (status.kind) {
        case 'unknown':
        case 'total':
            return null
        case 'problem':
            return <p className={classes.fieldError}>{status.message}</p>
        case 'sum':
            return (
                <p className={classes.mappingMeta}>
                    {i18n.t(
                        'The target has no categories: option combo values are added up into its total.'
                    )}
                </p>
            )
        case 'combos': {
            const total = status.pairs.length + status.unmatched.length
            return (
                <div className={classes.breakdown}>
                    <details className={classes.pairs}>
                        <summary>
                            {i18n.t(
                                '{{matched}}/{{total}} option combos matched',
                                { matched: status.pairs.length, total }
                            )}
                        </summary>
                        <ul>
                            {status.pairs.map((pair) => (
                                <li key={pair.sourceId}>
                                    {pair.sourceName} → {pair.stagingName}
                                </li>
                            ))}
                        </ul>
                    </details>
                    {status.unmatched.length > 0 && (
                        <p className={classes.fieldError}>
                            {i18n.t(
                                'Not on the target, so their values are left out: {{names}}.',
                                {
                                    names: status.unmatched
                                        .map((c) => c.name || c.id)
                                        .join(', '),
                                }
                            )}
                        </p>
                    )}
                </div>
            )
        }
    }
}

export function PushItemRow({
    index,
    routeCode,
    staging,
    target,
    targetPending,
    source,
    onRemove,
}: {
    index: number
    routeCode: string | undefined
    /** Staging data elements of the listed rows, once loaded. */
    staging: ReadonlyMap<string, PushDataElement> | undefined
    /** Target data elements of the listed rows, once loaded. */
    target: ReadonlyMap<string, PushDataElement> | undefined
    /** Target lookup is (re)fetching; rows whose target isn't in `target` yet are unknown. */
    targetPending: boolean
    source: PushSource
    onRemove: () => void
}): React.ReactElement {
    const { setValue } = useFormContext()
    const base = `handlerConfig.items.${index}`
    const item = (useWatch({ name: base }) ?? {}) as Partial<PushItem>
    const [changingTarget, setChangingTarget] = useState(false)

    const targetId = item.into || item.from
    const targetDataElement = targetId ? target?.get(targetId) : undefined
    const sameIdOnTarget = Boolean(item.from && target?.has(item.from))
    const checking = Boolean(targetId) && !targetDataElement && targetPending
    const missing =
        Boolean(targetId) && !targetDataElement && !targetPending && !!target
    const showPicker = changingTarget || Boolean(item.into) || missing
    const status = pushItemStatus(
        item.from ? staging?.get(item.from)?.meta : undefined,
        targetDataElement?.meta,
        source
    )

    function setInto(into: string | undefined) {
        setValue(`${base}.into`, into, {
            shouldDirty: true,
            shouldValidate: true,
        })
    }

    return (
        <li className={classes.itemRow}>
            <div className={classes.itemMain}>
                <div className={classes.itemSource}>
                    <DataElementSelector
                        name={`${base}.from`}
                        label={i18n.t('Staging data element')}
                        dense
                    />
                </div>
                <Button
                    small
                    secondary
                    icon={<IconDelete16 />}
                    aria-label={i18n.t('Remove data element')}
                    onClick={onRemove}
                />
            </div>

            {item.from && (
                <div className={classes.target}>
                    <span className={classes.arrow} aria-hidden>
                        →
                    </span>
                    <div className={classes.targetBody}>
                        <div className={classes.targetLine}>
                            {targetDataElement && (
                                <span className={classes.mappingName}>
                                    {targetDataElement.name}
                                </span>
                            )}
                            {checking && (
                                <span className={classes.loading}>
                                    <CircularLoader extrasmall />
                                    {i18n.t('Checking target…')}
                                </span>
                            )}
                            {missing && (
                                <span className={classes.mappingMeta}>
                                    {item.into
                                        ? i18n.t(
                                              '{{id}} doesn’t exist on the target.',
                                              { id: item.into }
                                          )
                                        : i18n.t(
                                              'No data element with this ID on the target.'
                                          )}
                                </span>
                            )}
                            {status.kind === 'problem' ? (
                                <Tag negative>{i18n.t('Can’t push')}</Tag>
                            ) : missing ? (
                                <Tag negative>
                                    {item.into
                                        ? i18n.t('Missing')
                                        : i18n.t('Pick target')}
                                </Tag>
                            ) : targetDataElement ? (
                                <Tag positive>
                                    {item.into
                                        ? i18n.t('Mapped')
                                        : i18n.t('Same ID')}
                                </Tag>
                            ) : null}
                            {targetDataElement && !showPicker && (
                                <button
                                    type="button"
                                    className={classes.linkButton}
                                    onClick={() => setChangingTarget(true)}
                                >
                                    {i18n.t('Change')}
                                </button>
                            )}
                            {sameIdOnTarget && showPicker && (
                                <button
                                    type="button"
                                    className={classes.linkButton}
                                    onClick={() => {
                                        setInto(undefined)
                                        setChangingTarget(false)
                                    }}
                                >
                                    {i18n.t('Use same ID')}
                                </button>
                            )}
                        </div>
                        {showPicker && (
                            <div className={classes.targetPicker}>
                                <SourceItemSelector
                                    routeCode={routeCode}
                                    label={i18n.t('Target data element')}
                                    itemTypes={DATA_ELEMENTS_ONLY}
                                    value={item.into}
                                    selected={
                                        item.into && targetDataElement
                                            ? {
                                                  id: item.into,
                                                  displayName:
                                                      targetDataElement.name,
                                                  dimensionItemType:
                                                      'DATA_ELEMENT',
                                              }
                                            : undefined
                                    }
                                    onSelect={(next) => {
                                        setInto(
                                            next.id === item.from
                                                ? undefined
                                                : next.id
                                        )
                                        setChangingTarget(false)
                                    }}
                                    resolving={checking}
                                />
                            </div>
                        )}
                        <Breakdown status={status} />
                    </div>
                </div>
            )}
        </li>
    )
}
