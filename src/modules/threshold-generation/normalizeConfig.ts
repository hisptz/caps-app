import {
    CALCULATION_METHOD_VALUES,
    DEFAULT_AGGREGATION_TYPE,
    DEFAULT_CALCULATION_METHOD,
    DEFAULT_YEARS_TO_INCLUDE,
    type CalculationMethod,
    type ThresholdOutputMode,
    type ThresholdOutputSpec,
    type ThresholdPeriodType,
    THRESHOLD_PERIOD_TYPE_VALUES,
} from './constants'
import {
    emitOrgUnitConfig,
    normalizeOrgUnitConfig,
} from '@/modules/org-unit-config/normalizeOrgUnit'

const LEGACY_METHOD_MAP: Record<string, CalculationMethod> = {
    'mean+2SD': 'mean + 2SD',
    'mean+SD': 'mean + SD',
}

const LEGACY_PERIOD_TYPE_MAP: Record<string, ThresholdPeriodType> = {
    daily: 'Monthly',
    weekly: 'Weekly',
    monthly: 'Monthly',
    Monthly: 'Monthly',
    Weekly: 'Weekly',
    Quarterly: 'Quarterly',
    BiMonthly: 'BiMonthly',
    SixMonthly: 'SixMonthly',
}

function isCalculationMethod(value: string): value is CalculationMethod {
    return (CALCULATION_METHOD_VALUES as readonly string[]).includes(value)
}

function normalizeCalculationMethod(
    raw: unknown
): CalculationMethod | undefined {
    if (typeof raw !== 'string') {
        return undefined
    }
    const mapped = LEGACY_METHOD_MAP[raw] ?? raw
    return isCalculationMethod(mapped) ? mapped : undefined
}

function normalizePeriodType(raw: unknown): ThresholdPeriodType | undefined {
    if (typeof raw !== 'string') {
        return undefined
    }
    const mapped = LEGACY_PERIOD_TYPE_MAP[raw]
    if (mapped) {
        return mapped
    }
    if ((THRESHOLD_PERIOD_TYPE_VALUES as readonly string[]).includes(raw)) {
        return raw as ThresholdPeriodType
    }
    return undefined
}

function normalizeYears(raw: unknown): string[] {
    if (!Array.isArray(raw)) {
        return []
    }
    return raw.map((y) => String(y).trim()).filter((y) => y.length > 0)
}

function normalizeOutputs(raw: unknown): ThresholdOutputSpec[] {
    if (!Array.isArray(raw)) {
        return []
    }
    const specs: ThresholdOutputSpec[] = []
    for (const item of raw) {
        if (typeof item !== 'object' || item === null) {
            continue
        }
        const row = item as Record<string, unknown>
        const method = normalizeCalculationMethod(row.calculationMethod)
        const outputId =
            typeof row.outputDataElementId === 'string'
                ? row.outputDataElementId.trim()
                : ''
        if (method && outputId) {
            specs.push({
                calculationMethod: method,
                outputDataElementId: outputId,
            })
        }
    }
    return specs
}

export function getOutputMode(
    config: Record<string, unknown> | null
): ThresholdOutputMode {
    const outputs = config?.outputs
    if (Array.isArray(outputs) && outputs.length > 0) {
        return 'batch'
    }
    return 'single'
}

export function normalizeThresholdConfigForLoad(
    raw: Record<string, unknown> | null
): Record<string, unknown> {
    if (!raw) {
        return {}
    }

    const periodRaw =
        typeof raw.period === 'object' && raw.period !== null
            ? (raw.period as Record<string, unknown>)
            : {}

    const periodType = normalizePeriodType(periodRaw.periodType)
    const years = normalizeYears(periodRaw.years)
    const yearsToInclude =
        typeof periodRaw.yearsToInclude === 'number' &&
        Number.isInteger(periodRaw.yearsToInclude) &&
        periodRaw.yearsToInclude > 0
            ? periodRaw.yearsToInclude
            : DEFAULT_YEARS_TO_INCLUDE

    const dataElementIds = Array.isArray(raw.dataElementIds)
        ? (raw.dataElementIds as unknown[])
              .map((id) => String(id).trim())
              .filter(Boolean)
        : []

    const aggregationType =
        typeof raw.aggregationType === 'string' && raw.aggregationType.trim()
            ? raw.aggregationType.trim()
            : DEFAULT_AGGREGATION_TYPE

    const orgUnit = ensureEditableOrgUnitForForm(
        normalizeOrgUnitConfig(raw.orgUnit)
    )
    const outputs = normalizeOutputs(raw.outputs)
    const mode = outputs.length > 0 ? 'batch' : 'single'

    const normalized: Record<string, unknown> = {
        orgUnit,
        period: {
            years,
            yearsToInclude,
            ...(periodType ? { periodType } : {}),
        },
        dataElementIds,
        aggregationType,
    }

    if (mode === 'batch') {
        normalized.outputs = outputs
    } else {
        const calculationMethod =
            normalizeCalculationMethod(raw.calculationMethod) ??
            DEFAULT_CALCULATION_METHOD
        const outputDataElementId =
            typeof raw.outputDataElementId === 'string'
                ? raw.outputDataElementId.trim()
                : ''
        normalized.calculationMethod = calculationMethod
        if (outputDataElementId) {
            normalized.outputDataElementId = outputDataElementId
        }
    }

    return normalized
}

function ensureEditableOrgUnitForForm(
    orgUnit: ReturnType<typeof normalizeOrgUnitConfig>
): Record<string, unknown> {
    return {
        ids: orgUnit.ids ?? [],
        levels: orgUnit.levels ?? [],
        groups: orgUnit.groups ?? [],
    }
}

export function emitThresholdConfig(
    draft: Record<string, unknown>,
    mode: ThresholdOutputMode
): Record<string, unknown> {
    const next = { ...draft }
    next.orgUnit = emitOrgUnitConfig(draft.orgUnit)

    if (mode === 'batch') {
        delete next.calculationMethod
        delete next.outputDataElementId
        const outputs = normalizeOutputs(next.outputs)
        if (outputs.length > 0) {
            next.outputs = outputs
        } else {
            next.outputs = [
                {
                    calculationMethod: DEFAULT_CALCULATION_METHOD,
                    outputDataElementId: '',
                },
            ]
        }
    } else {
        delete next.outputs
        if (!next.calculationMethod) {
            next.calculationMethod = DEFAULT_CALCULATION_METHOD
        }
    }

    return next
}

export function hasDuplicateOutputMethods(
    outputs: ThresholdOutputSpec[]
): boolean {
    const methods = outputs.map((o) => o.calculationMethod)
    return new Set(methods).size !== methods.length
}
