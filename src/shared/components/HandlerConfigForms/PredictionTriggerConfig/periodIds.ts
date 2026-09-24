export const DEFAULT_PERIODS_TO_GENERATE = 3

function isoWeek(date: Date): { weekYear: number; week: number } {
    const target = new Date(
        Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
    )
    target.setUTCDate(target.getUTCDate() + 4 - (target.getUTCDay() || 7))
    const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1))
    const week = Math.ceil(
        ((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
    )
    return { weekYear: target.getUTCFullYear(), week }
}

export function periodIdAtOffset(
    periodType: string | null,
    offset: number,
    now = new Date()
): string {
    if (periodType === 'week') {
        const target = new Date(now)
        target.setDate(target.getDate() - 7 * offset)
        const { weekYear, week } = isoWeek(target)
        return `${weekYear}W${week}`
    }
    const target = new Date(now.getFullYear(), now.getMonth() - offset, 1)
    return `${target.getFullYear()}${String(target.getMonth() + 1).padStart(2, '0')}`
}

export function lastCompletePeriodId(
    periodType: string | null,
    now = new Date()
): string {
    return periodIdAtOffset(periodType, 1, now)
}
