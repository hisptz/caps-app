import { DEFAULT_AGGREGATION_TYPE } from './constants'
import {
    emitOrgUnitConfig,
    normalizeOrgUnitConfig,
} from '@/modules/org-unit-config/normalizeOrgUnit'

function valueDataElementIdsForLoad(raw: Record<string, unknown>): string[] {
    if (Array.isArray(raw.valueDataElementIds)) {
        const ids = (raw.valueDataElementIds as unknown[])
            .map((id) => String(id).trim())
            .filter(Boolean)
        if (ids.length > 0) {
            return ids
        }
    }
    if (
        typeof raw.valueDataElementId === 'string' &&
        raw.valueDataElementId.trim()
    ) {
        return [raw.valueDataElementId.trim()]
    }
    return ['']
}

function valueDataElementIdsForEmit(draft: Record<string, unknown>): string[] {
    if (Array.isArray(draft.valueDataElementIds)) {
        return (draft.valueDataElementIds as unknown[])
            .map((id) => String(id).trim())
            .filter(Boolean)
    }
    if (
        typeof draft.valueDataElementId === 'string' &&
        draft.valueDataElementId.trim()
    ) {
        return [draft.valueDataElementId.trim()]
    }
    return []
}

export function normalizeAlertConfigForLoad(
    raw: Record<string, unknown> | null
): Record<string, unknown> {
    const base = raw !== null && typeof raw === 'object' ? { ...raw } : {}
    delete base.valueDataElementId

    const period =
        typeof base.period === 'object' && base.period !== null
            ? { ...(base.period as Record<string, unknown>) }
            : {}

    const periods = Array.isArray(period.periods)
        ? [...(period.periods as string[])]
        : []
    if (periods.length === 0) {
        period.periods = ['']
    } else {
        period.periods = periods
    }

    const source = raw !== null && typeof raw === 'object' ? raw : {}

    return {
        aggregationType: DEFAULT_AGGREGATION_TYPE,
        thresholdDataElementId: '',
        orgUnit: { ids: [], levels: [], groups: [] },
        ...base,
        period,
        valueDataElementIds: valueDataElementIdsForLoad(source),
    }
}

export function emitAlertConfig(
    draft: Record<string, unknown>
): Record<string, unknown> {
    const period =
        typeof draft.period === 'object' && draft.period !== null
            ? { ...(draft.period as Record<string, unknown>) }
            : {}

    const periods = Array.isArray(period.periods)
        ? (period.periods as string[])
              .map((p) => String(p).trim())
              .filter(Boolean)
        : []

    const next: Record<string, unknown> = {
        orgUnit: emitOrgUnitConfig(draft.orgUnit),
        period: { periods },
        thresholdDataElementId:
            typeof draft.thresholdDataElementId === 'string'
                ? draft.thresholdDataElementId.trim()
                : '',
        valueDataElementIds: valueDataElementIdsForEmit(draft),
        aggregationType:
            typeof draft.aggregationType === 'string' &&
            draft.aggregationType.trim()
                ? draft.aggregationType.trim()
                : DEFAULT_AGGREGATION_TYPE,
    }

    return next
}

export function ensureEditableOrgUnit(
    config: Record<string, unknown>
): Record<string, unknown> {
    const orgUnit = normalizeOrgUnitConfig(config.orgUnit)
    return {
        ...config,
        orgUnit: {
            ids: orgUnit.ids ?? [],
            levels: orgUnit.levels ?? [],
            groups: orgUnit.groups ?? [],
        },
    }
}

export function ensureEditablePeriods(
    config: Record<string, unknown>
): Record<string, unknown> {
    const period =
        typeof config.period === 'object' && config.period !== null
            ? { ...(config.period as Record<string, unknown>) }
            : {}
    const periods = Array.isArray(period.periods)
        ? [...(period.periods as string[])]
        : []
    period.periods = periods.length > 0 ? periods : ['']
    return { ...config, period }
}

export function ensureEditableValueDataElementIds(
    config: Record<string, unknown>
): Record<string, unknown> {
    const ids = valueDataElementIdsForLoad(config)
    return {
        ...config,
        valueDataElementIds: ids.length > 0 ? ids : [''],
    }
}
