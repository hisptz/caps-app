import i18n from '@dhis2/d2-i18n'
import type { PullItemType } from '@/modules/dhis2-instance-pull/schemas/config'

const INTEGER_TYPES = new Set([
    'INTEGER',
    'INTEGER_POSITIVE',
    'INTEGER_NEGATIVE',
    'INTEGER_ZERO_OR_POSITIVE',
])
const DECIMAL_TYPES = new Set(['NUMBER', 'PERCENTAGE', 'UNIT_INTERVAL'])

/**
 * Mirrors caps-engine `dhis2InstancePull/utils/valueTypes.ts`: why values of this item can't be
 * stored in a staging data element of `stagingValueType`, or null when they can (or the value
 * type isn't known yet).
 */
export function valueTypeProblem(
    fromType: PullItemType,
    sourceValueType: string | undefined,
    stagingValueType: string | undefined
): string | null {
    if (!stagingValueType) {
        return null
    }
    if (
        !INTEGER_TYPES.has(stagingValueType) &&
        !DECIMAL_TYPES.has(stagingValueType)
    ) {
        return i18n.t(
            'Destination data element holds {{valueType}} values, not numbers. Pick a numeric data element.',
            { valueType: stagingValueType }
        )
    }
    if (!INTEGER_TYPES.has(stagingValueType)) {
        return null
    }
    if (fromType === 'INDICATOR') {
        return i18n.t(
            'Indicator values can have decimals, but destination data element only takes whole numbers. Pick one with value type Number.'
        )
    }
    if (
        fromType === 'DATA_ELEMENT' &&
        sourceValueType &&
        DECIMAL_TYPES.has(sourceValueType)
    ) {
        return i18n.t(
            'The source data element has decimal values, but destination one only takes whole numbers. Pick one with value type Number.'
        )
    }
    return null
}
