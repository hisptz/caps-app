export type SyncEndGranularity = 'day' | 'month' | 'year'

export function getSyncEndGranularity(
    periodTypes: Array<string | null | undefined>
): SyncEndGranularity {
    const types = new Set(periodTypes.map((t) => t?.trim().toLowerCase()))
    if (types.size === 1 && types.has('yearly')) {
        return 'year'
    }
    if (
        types.size > 0 &&
        [...types].every((t) => t === 'monthly' || t === 'yearly')
    ) {
        return 'month'
    }
    return 'day'
}

/** Last day of the month, as the `YYYY-MM-DD` end the engine expects. */
export function monthEndDate(year: number, month: number): string {
    const day = new Date(Date.UTC(year, month, 0)).getUTCDate()
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/** Year and month (1-12) of a stored `YYYY-MM-DD` end, or undefined when unset or malformed. */
export function parseSyncEnd(
    value: unknown
): { year: number; month: number } | undefined {
    if (typeof value !== 'string') {
        return undefined
    }
    const match = /^(\d{4})-(\d{2})-\d{2}$/.exec(value)
    if (!match) {
        return undefined
    }
    return { year: Number(match[1]), month: Number(match[2]) }
}
