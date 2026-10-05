import type { PullItem } from '@/modules/dhis2-instance-pull/schemas/config'

export type RowState =
    /** No source item picked yet. */
    | { kind: 'unset' }
    /** Staging status still loading. */
    | { kind: 'checking' }
    /** Staging has a data element with the source's ID; the row writes into it. */
    | { kind: 'linked'; targetName: string }
    /** Writes into a different, existing staging data element. */
    | { kind: 'mapped'; targetName: string }
    /** No staging target yet: the user has to pick a staging data element. */
    | { kind: 'pick'; reason: 'no-match' | 'not-a-data-element' }
    /** Created on staging when the step is saved (only when creation is switched on). */
    | { kind: 'create'; newId: boolean }
    /** Writes into a staging data element that doesn't exist (deleted, or a stale ID). */
    | { kind: 'missing'; targetId: string }

/**
 * Where a pull row's values end up on staging. `staging` maps existing staging data element
 * IDs to names; `undefined` while it's loading. With `allowCreate`, rows without a staging
 * target are created on save instead of asking the user to pick one.
 */
export function rowState(
    item: Partial<PullItem>,
    staging: ReadonlyMap<string, string> | undefined,
    { allowCreate = false }: { allowCreate?: boolean } = {}
): RowState {
    if (!item.from || !item.fromType) {
        return { kind: 'unset' }
    }
    const isDataElement = item.fromType === 'DATA_ELEMENT'
    if (!item.into && !isDataElement) {
        return allowCreate
            ? { kind: 'create', newId: true }
            : { kind: 'pick', reason: 'not-a-data-element' }
    }
    if (!staging) {
        return { kind: 'checking' }
    }
    const target = item.into ?? item.from
    const name = staging.get(target)
    if (isDataElement && target === item.from) {
        if (name !== undefined) {
            return { kind: 'linked', targetName: name }
        }
        return allowCreate
            ? { kind: 'create', newId: false }
            : { kind: 'pick', reason: 'no-match' }
    }
    return name !== undefined
        ? { kind: 'mapped', targetName: name }
        : { kind: 'missing', targetId: target }
}
