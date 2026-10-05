import i18n from '@dhis2/d2-i18n'
import type { PullItem } from '@/modules/dhis2-instance-pull/schemas/config'
import { valueTypeProblem } from '@/modules/dhis2-instance-pull/utils/valueTypes'

/**
 * Mirrors caps-engine `dhis2InstancePull/utils/categoryCombos.ts` and `itemPlans.ts` (with the
 * value type check from `valueTypes.ts`): the
 * step form shows what the engine will do with each row, and blocks saving when the engine
 * would fail.
 */

/** A data element's category combo (and value type) as the pull needs it. */
export type ComboMeta = {
    isDefault: boolean
    optionCombos: { id: string; name: string }[]
    valueType?: string
}

export type ComboPair = {
    sourceId: string
    sourceName: string
    stagingId: string
    stagingName: string
}

export type ComboMatch =
    | { kind: 'total' }
    | {
          kind: 'combos'
          pairs: ComboPair[]
          unmatched: { id: string; name: string }[]
      }
    | {
          kind: 'incompatible'
          reason: 'source-has-no-categories' | 'no-common-option-combos'
      }

type DataElementWithCombo = {
    valueType?: string
    categoryCombo?: {
        name?: string
        isDefault?: boolean
        categoryOptionCombos?: { id: string; name?: string }[]
    }
}

export const COMBO_FIELDS =
    'id,displayName,valueType,categoryCombo[name,isDefault,categoryOptionCombos[id,name]]'

export function toComboMeta(dataElement: DataElementWithCombo): ComboMeta {
    const combo = dataElement.categoryCombo
    return {
        isDefault: combo?.isDefault ?? (!combo || combo.name === 'default'),
        optionCombos: (combo?.categoryOptionCombos ?? []).map(
            ({ id, name }) => ({ id, name: name ?? '' })
        ),
        valueType: dataElement.valueType,
    }
}

export function normalizeComboName(name: string): string {
    return name
        .split(',')
        .map((part) => part.trim().toLowerCase().replace(/\s+/g, ' '))
        .filter(Boolean)
        .sort()
        .join('|')
}

/** Source option combos matched to staging ones by ID first, then by name. */
export function matchCategoryOptionCombos(
    source: ComboMeta,
    staging: ComboMeta
): ComboMatch {
    if (staging.isDefault) {
        return { kind: 'total' }
    }
    if (source.isDefault) {
        return { kind: 'incompatible', reason: 'source-has-no-categories' }
    }
    const stagingById = new Map(staging.optionCombos.map((c) => [c.id, c]))
    const stagingByName = new Map(
        staging.optionCombos.map(
            (c) => [normalizeComboName(c.name), c] as const
        )
    )
    const used = new Set<string>()
    const pairs: ComboPair[] = []
    const unmatched: { id: string; name: string }[] = []
    for (const combo of source.optionCombos) {
        const byId = stagingById.get(combo.id)
        const match =
            byId && !used.has(byId.id)
                ? byId
                : stagingByName.get(normalizeComboName(combo.name))
        if (match && !used.has(match.id)) {
            used.add(match.id)
            pairs.push({
                sourceId: combo.id,
                sourceName: combo.name,
                stagingId: match.id,
                stagingName: match.name,
            })
        } else {
            unmatched.push(combo)
        }
    }
    if (pairs.length === 0) {
        return { kind: 'incompatible', reason: 'no-common-option-combos' }
    }
    return { kind: 'combos', pairs, unmatched }
}

export type ItemComboStatus =
    | { kind: 'unknown' }
    | { kind: 'total' }
    | {
          kind: 'combos'
          pairs: ComboPair[]
          unmatched: { id: string; name: string }[]
      }
    | { kind: 'problem'; message: string }

/** What the engine will do with one item, given both sides' category combos. */
export function itemComboStatus(
    item: Pick<PullItem, 'fromType'>,
    source: ComboMeta | undefined,
    staging: ComboMeta | undefined
): ItemComboStatus {
    if (!staging) {
        return { kind: 'unknown' }
    }
    const typeProblem = valueTypeProblem(
        item.fromType,
        source?.valueType,
        staging.valueType
    )
    if (typeProblem) {
        return { kind: 'problem', message: typeProblem }
    }
    if (staging.isDefault) {
        return { kind: 'total' }
    }
    if (item.fromType !== 'DATA_ELEMENT') {
        return {
            kind: 'problem',
            message: i18n.t(
                'This staging data element has categories, but indicators and program indicators only give totals. Pick one without categories.'
            ),
        }
    }
    if (!source) {
        return { kind: 'unknown' }
    }
    const match = matchCategoryOptionCombos(source, staging)
    if (match.kind === 'total') {
        return match
    }
    if (match.kind === 'incompatible') {
        return {
            kind: 'problem',
            message:
                match.reason === 'source-has-no-categories'
                    ? i18n.t(
                          'This staging data element has categories but the source’s has none, so there’s no breakdown to fill it. Pick one without categories.'
                      )
                    : i18n.t(
                          'None of the source’s option combos match this staging data element’s, by ID or by name.'
                      ),
        }
    }
    return {
        kind: 'combos',
        pairs: match.pairs,
        unmatched: match.unmatched,
    }
}
