import i18n from '@dhis2/d2-i18n'
import {
    type ComboMeta,
    type ComboPair,
    matchCategoryOptionCombos,
} from '@/modules/dhis2-instance-pull/utils/categoryCombos'
import type { PushSource } from '@/modules/dhis2-instance-push/schemas/config'

/**
 * Mirrors caps-engine `dhis2InstancePush/utils/itemPlans.ts` (`planPushItems`): the step
 * form shows what the engine will do with each row, and flags rows the engine would refuse.
 */

/** A data element's category combo, value type and aggregation type, as the push needs them. */
export type PushMeta = ComboMeta & { aggregationType?: string }

export type PushItemStatus =
    | { kind: 'unknown' }
    /** Values go as they are. */
    | { kind: 'total' }
    /** Option combo values are added up into the target's total. */
    | { kind: 'sum' }
    | {
          kind: 'combos'
          pairs: ComboPair[]
          /** Staging option combos with no match; their values are left out. */
          unmatched: { id: string; name: string }[]
      }
    | { kind: 'problem'; message: string }

const INTEGER_TYPES = new Set([
    'INTEGER',
    'INTEGER_POSITIVE',
    'INTEGER_NEGATIVE',
    'INTEGER_ZERO_OR_POSITIVE',
])
const NUMERIC_TYPES = new Set([
    ...INTEGER_TYPES,
    'NUMBER',
    'PERCENTAGE',
    'UNIT_INTERVAL',
])

function valueTypeProblem(
    stagingType: string | undefined,
    targetType: string | undefined
): string | null {
    if (!stagingType || !targetType || stagingType === targetType) {
        return null
    }
    if (!NUMERIC_TYPES.has(stagingType) || !NUMERIC_TYPES.has(targetType)) {
        return i18n.t(
            'The staging data element holds {{stagingType}} values, but the target’s holds {{targetType}}. Pick a target data element with the same value type.',
            { stagingType, targetType }
        )
    }
    if (INTEGER_TYPES.has(targetType) && !INTEGER_TYPES.has(stagingType)) {
        return i18n.t(
            'The staging data element has decimal values, but the target’s only takes whole numbers. Pick one with value type Number.'
        )
    }
    return null
}

/** What the engine will do with one row, given both sides' data elements. */
export function pushItemStatus(
    staging: PushMeta | undefined,
    target: PushMeta | undefined,
    source: PushSource = 'raw'
): PushItemStatus {
    if (!staging || !target) {
        return { kind: 'unknown' }
    }
    const typeProblem = valueTypeProblem(staging.valueType, target.valueType)
    if (typeProblem) {
        return { kind: 'problem', message: typeProblem }
    }
    const match = matchCategoryOptionCombos(staging, target)
    if (match.kind === 'total') {
        // Analytics gives totals itself, with the data element's own aggregation type.
        if (staging.isDefault || source === 'analytics') {
            return { kind: 'total' }
        }
        if (staging.aggregationType === 'SUM') {
            return { kind: 'sum' }
        }
        return {
            kind: 'problem',
            message: i18n.t(
                'The staging data element has categories but the target’s has none, and its values can’t be added up into a total (aggregation type {{type}}). Pick a target data element with the same categories.',
                { type: staging.aggregationType ?? i18n.t('unknown') }
            ),
        }
    }
    if (match.kind === 'incompatible') {
        return {
            kind: 'problem',
            message:
                match.reason === 'source-has-no-categories'
                    ? i18n.t(
                          'The target data element has categories but the staging one has none, so there’s no breakdown to fill it. Pick a target data element without categories.'
                      )
                    : i18n.t(
                          'None of the staging option combos match the target data element’s, by ID or by name.'
                      ),
        }
    }
    return { kind: 'combos', pairs: match.pairs, unmatched: match.unmatched }
}
