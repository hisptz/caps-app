import {
    createFixedPeriodFromPeriodId,
    periodTypes,
} from '@dhis2/multi-calendar-dates'

type PeriodType = (typeof periodTypes)[number]

const CALENDAR = 'iso8601' as const

export function toPeriodType(periodType: string): PeriodType | undefined {
    const normalized = periodType.trim().toUpperCase()
    return (periodTypes as readonly string[]).includes(normalized)
        ? (normalized as PeriodType)
        : undefined
}

export function resolvePeriodScope(periodIds: string[]): {
    start: string
    end: string
} {
    const periods = periodIds.map((periodId) => {
        const period = createFixedPeriodFromPeriodId({
            periodId,
            calendar: CALENDAR,
        })
        return {
            start: period.startDate,
            end: period.endDate,
        }
    })

    const start = periods.reduce((min, period) => {
        return period.start < min ? period.start : min
    }, periods[0].start)
    const end = periods.reduce((max, period) => {
        return period.end > max ? period.end : max
    }, periods[0].end)

    return {
        start,
        end,
    }
}
