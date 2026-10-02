import i18n from '@dhis2/d2-i18n'
import { Button, CircularLoader, IconDelete16, Tag } from '@dhis2/ui'
import React, { useState } from 'react'
import { useController, useFormContext, useWatch } from 'react-hook-form'
import { ConfigLabeledControl } from '../ConfigLabeledControl'
import { DataElementSelector } from '../DataElementSelector'
import classes from './Dhis2InstancePullConfig.module.css'
import { SourceItemSelector } from './SourceItemSelector'
import { CREATE_MISSING_DATA_ELEMENTS } from '@/modules/dhis2-instance-pull/constants'
import type { SourceDataItem } from '@/modules/dhis2-instance-pull/hooks/usePullItemQueries'
import type {
    CreatedAggregationType,
    PullItem,
} from '@/modules/dhis2-instance-pull/schemas/config'
import {
    type ComboMeta,
    type ItemComboStatus,
    itemComboStatus,
} from '@/modules/dhis2-instance-pull/utils/categoryCombos'
import {
    rowState,
    type RowState,
} from '@/modules/dhis2-instance-pull/utils/rowState'
import { SegmentedControl } from '@/shared/components/ui/FormPrimitives'

const AGGREGATION_OPTIONS: Array<{
    value: CreatedAggregationType
    label: string
}> = [
    { value: 'AVERAGE', label: i18n.t('Average') },
    { value: 'SUM', label: i18n.t('Sum') },
]

type IndicatorTarget = 'create' | 'existing'

function StateTag({
    state,
    combos,
}: {
    state: RowState
    combos: ItemComboStatus | null
}): React.ReactElement | null {
    if (
        combos &&
        (combos.kind === 'problem' ||
            (combos.kind === 'combos' && combos.unmatched.length > 0))
    ) {
        return <Tag negative>{i18n.t('Can’t pull')}</Tag>
    }
    switch (state.kind) {
        case 'linked':
            return <Tag positive>{i18n.t('Same ID')}</Tag>
        case 'mapped':
            return <Tag positive>{i18n.t('Mapped')}</Tag>
        case 'pick':
            return <Tag neutral>{i18n.t('Pick target')}</Tag>
        case 'create':
            return <Tag neutral>{i18n.t('New')}</Tag>
        case 'missing':
            return <Tag negative>{i18n.t('Missing')}</Tag>
        default:
            return null
    }
}

/** Only shown when there is something to say; a plain total needs no note. */
function Breakdown({
    status,
}: {
    status: ItemComboStatus
}): React.ReactElement | null {
    switch (status.kind) {
        case 'unknown':
        case 'total':
            return null
        case 'problem':
            return <p className={classes.fieldError}>{status.message}</p>
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
                                'Not on the destination: {{names}}. Pick a target without categories or with matching option combos.',
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

function stateHint(state: RowState): string | null {
    switch (state.kind) {
        case 'pick':
            return state.reason === 'no-match'
                ? i18n.t('No data element with this ID on the destination.')
                : i18n.t('Indicators can’t hold values.')
        case 'create':
            return i18n.t('Created on save')
        case 'missing':
            return i18n.t('{{id}} no longer exists on the destination.', {
                id: state.targetId,
            })
        default:
            return null
    }
}

export function SourceItemRow({
    index,
    routeCode,
    selected,
    staging,
    stagingPending,
    sourcePending,
    stagingCombo,
    sourceCombo,
    onRemove,
}: {
    index: number
    routeCode: string | undefined
    selected: SourceDataItem | undefined
    staging: ReadonlyMap<string, string> | undefined
    /** Destination lookup is refetching; rows whose target isn't in `staging` yet are unknown. */
    stagingPending: boolean
    /** Source names or category combos are still loading. */
    sourcePending: boolean
    /** Category combo of the staging data element this row writes into, once loaded. */
    stagingCombo: ComboMeta | undefined
    /** Category combo of the source data element, once loaded (data element rows only). */
    sourceCombo: ComboMeta | undefined
    onRemove: () => void
}): React.ReactElement {
    const { setValue } = useFormContext()
    const base = `handlerConfig.items.${index}`
    const item = (useWatch({ name: base }) ?? {}) as Partial<PullItem>
    const { fieldState: fromState } = useController({ name: `${base}.from` })
    const { field: aggregation } = useController({
        name: `handlerDrafts.${item.from ?? '_'}.aggregationType`,
        defaultValue: 'AVERAGE',
    })
    const [changingTarget, setChangingTarget] = useState(false)

    // `into: ''` means "existing data element" was chosen but none picked yet.
    const isDataElement = item.fromType === 'DATA_ELEMENT'
    const target = item.into || (isDataElement ? item.from : undefined)
    const state: RowState =
        item.into === ''
            ? { kind: 'pick', reason: 'not-a-data-element' }
            : stagingPending && target && !staging?.has(target)
              ? { kind: 'checking' }
              : rowState(item, staging, {
                    allowCreate: CREATE_MISSING_DATA_ELEMENTS,
                })
    const sameIdOnStaging = Boolean(
        isDataElement && item.from && staging?.has(item.from)
    )
    const indicatorTarget: IndicatorTarget =
        item.into !== undefined ? 'existing' : 'create'
    const showCreateChoice = CREATE_MISSING_DATA_ELEMENTS && !isDataElement
    const showPicker =
        state.kind === 'pick' ||
        state.kind === 'mapped' ||
        state.kind === 'missing' ||
        (state.kind === 'linked' && changingTarget) ||
        (showCreateChoice && indicatorTarget === 'existing')

    function selectSource(next: SourceDataItem) {
        setValue(
            base,
            { from: next.id, fromType: next.dimensionItemType },
            { shouldDirty: true, shouldValidate: true }
        )
        setChangingTarget(false)
    }

    function setInto(into: string | undefined) {
        setValue(`${base}.into`, into, {
            shouldDirty: true,
            shouldValidate: true,
        })
    }

    const combos: ItemComboStatus | null =
        (state.kind === 'linked' && !changingTarget) || state.kind === 'mapped'
            ? itemComboStatus(
                  { fromType: item.fromType! },
                  sourceCombo,
                  stagingCombo
              )
            : null
    const hint = stateHint(state)
    const showLinked = state.kind === 'linked' && !changingTarget

    return (
        <li className={classes.itemRow}>
            <div className={classes.itemMain}>
                <div className={classes.itemSource}>
                    <SourceItemSelector
                        routeCode={routeCode}
                        value={item.from}
                        selected={selected}
                        onSelect={selectSource}
                        error={Boolean(fromState.error)}
                        validationText={fromState.error?.message}
                        resolving={sourcePending}
                    />
                </div>
                <Button
                    small
                    secondary
                    icon={<IconDelete16 />}
                    aria-label={i18n.t('Remove item')}
                    onClick={onRemove}
                />
            </div>

            {item.from && item.fromType && (
                <div className={classes.target}>
                    <span className={classes.arrow} aria-hidden>
                        →
                    </span>
                    <div className={classes.targetBody}>
                        <div className={classes.targetLine}>
                            {showLinked && (
                                <span className={classes.mappingName}>
                                    {state.targetName}
                                </span>
                            )}
                            {state.kind === 'checking' && (
                                <span className={classes.loading}>
                                    <CircularLoader extrasmall />
                                    {i18n.t('Checking destination…')}
                                </span>
                            )}
                            {hint && (
                                <span className={classes.mappingMeta}>
                                    {hint}
                                </span>
                            )}
                            <StateTag state={state} combos={combos} />
                            {item.from && isDataElement && showLinked && (
                                <button
                                    type="button"
                                    className={classes.linkButton}
                                    onClick={() => setChangingTarget(true)}
                                >
                                    {i18n.t('Change')}
                                </button>
                            )}
                            {sameIdOnStaging &&
                                (changingTarget || state.kind === 'mapped') && (
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
                                <DataElementSelector
                                    name={`${base}.into`}
                                    label={i18n.t('Destination data element')}
                                    dense
                                />
                            </div>
                        )}
                        {combos?.kind === 'unknown' &&
                            (sourcePending || stagingPending) && (
                                <span className={classes.loading}>
                                    <CircularLoader extrasmall />
                                    {i18n.t('Checking categories…')}
                                </span>
                            )}
                        {combos && <Breakdown status={combos} />}
                    </div>
                </div>
            )}

            {item.from && showCreateChoice && (
                <div className={classes.itemTarget}>
                    <ConfigLabeledControl label={i18n.t('Write into')}>
                        <SegmentedControl<IndicatorTarget>
                            name={`${base}-target`}
                            value={indicatorTarget}
                            options={[
                                {
                                    value: 'create',
                                    label: i18n.t('New data element'),
                                },
                                {
                                    value: 'existing',
                                    label: i18n.t('Existing data element'),
                                },
                            ]}
                            onChange={(next) => {
                                if (next === 'create') {
                                    setInto(undefined)
                                } else if (item.into === undefined) {
                                    // Shows the picker; the row stays invalid until one is chosen.
                                    setInto('')
                                }
                            }}
                            aria-label={i18n.t('Write into')}
                        />
                    </ConfigLabeledControl>
                    {indicatorTarget === 'create' &&
                        item.fromType === 'INDICATOR' && (
                            <ConfigLabeledControl
                                label={i18n.t('Aggregation')}
                                helpText={i18n.t(
                                    'Average rates and percentages.'
                                )}
                            >
                                <SegmentedControl<CreatedAggregationType>
                                    name={`${base}-aggregation`}
                                    value={
                                        (aggregation.value as CreatedAggregationType) ??
                                        'AVERAGE'
                                    }
                                    options={AGGREGATION_OPTIONS}
                                    onChange={aggregation.onChange}
                                    aria-label={i18n.t('Aggregation type')}
                                />
                            </ConfigLabeledControl>
                        )}
                </div>
            )}
        </li>
    )
}
