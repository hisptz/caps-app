import type {
    PullPeriod,
    PullPeriodType,
} from '@/modules/dhis2-instance-pull/schemas/config'

const DAY_MS = 86_400_000

function isoWeekId(monday: Date): string {
    const thursday = new Date(monday.getTime() + 3 * DAY_MS)
    const year = thursday.getUTCFullYear()
    const week = Math.ceil(
        ((thursday.getTime() - Date.UTC(year, 0, 1)) / DAY_MS + 1) / 7
    )
    return `${year}W${week}`
}

function mondayOf(date: Date): Date {
    const day = date.getUTCDay() || 7
    return new Date(
        Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) -
            (day - 1) * DAY_MS
    )
}

/** The period `steps` periods after (negative: before) the one `date` falls in. */
function periodIdAt(
    date: Date,
    periodType: PullPeriodType,
    steps: number
): string {
    if (periodType === 'MONTHLY') {
        const d = new Date(
            Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + steps, 1)
        )
        return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}`
    }
    return isoWeekId(new Date(mondayOf(date).getTime() + steps * 7 * DAY_MS))
}

export function relativeWindow(
    period: PullPeriod,
    now: Date = new Date()
): { first: string; last: string } | null {
    if (period.mode !== 'relative') {
        return null
    }
    const offset = Number.isFinite(period.offset) ? period.offset : 1
    return {
        first: periodIdAt(now, period.periodType, -(offset + period.count - 1)),
        last: periodIdAt(now, period.periodType, -offset),
    }
}
