import { generateFixedPeriods } from '@dhis2/multi-calendar-dates'
import type { ClimateTemporalExtent } from '@/capsApi/types'
import { toPeriodType } from '@/modules/climate-data/utils/periodScope'

export type HandlerPeriodType = 'daily' | 'weekly' | 'monthly'

type PeriodWithCoverageDates = {
    startDate: string
    endDate: string
}

export function normalizeDatasetPeriodType(
    periodType: string | undefined
): HandlerPeriodType | undefined {
    if (!periodType) {
        return undefined
    }

    const normalized = toPeriodType(periodType)
    if (!normalized) {
        return undefined
    }

    const lower = normalized.toLowerCase()
    if (lower === 'daily' || lower === 'weekly' || lower === 'monthly') {
        return lower
    }

    return undefined
}

export function getDatasetTemporalExtent(
    dataset:
        | {
              extent?: { temporal?: ClimateTemporalExtent }
          }
        | undefined
) {
    return dataset?.extent?.temporal
}

export function getCoverageYearRange(
    coverageStart: string | null | undefined,
    coverageEnd: string | null | undefined
): { minYear: number; maxYear: number } {
    const currentYear = new Date().getFullYear()

    if (!coverageStart || !coverageEnd) {
        return { minYear: currentYear - 9, maxYear: currentYear }
    }

    const minYear = Number.parseInt(coverageStart.slice(0, 4), 10)
    const maxYear = Number.parseInt(coverageEnd.slice(0, 4), 10)

    if (Number.isNaN(minYear) || Number.isNaN(maxYear)) {
        return { minYear: currentYear - 9, maxYear: currentYear }
    }

    return { minYear, maxYear: Math.max(minYear, maxYear) }
}

function lastDayOfMonth(year: number, month: number): string {
    const day = new Date(Date.UTC(year, month, 0)).getUTCDate()
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function normalizeCoverageBound(
    value: string | null | undefined,
    bound: 'start' | 'end'
): string | undefined {
    const trimmed = value?.trim().split('T')[0]
    if (!trimmed) {
        return undefined
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        return trimmed
    }

    const monthMatch = /^(\d{4})-(\d{2})$/.exec(trimmed)
    if (monthMatch) {
        const year = Number(monthMatch[1])
        const month = Number(monthMatch[2])
        return bound === 'start'
            ? `${monthMatch[1]}-${monthMatch[2]}-01`
            : lastDayOfMonth(year, month)
    }

    if (/^\d{4}$/.test(trimmed)) {
        return bound === 'start' ? `${trimmed}-01-01` : `${trimmed}-12-31`
    }

    return undefined
}

export function periodOverlapsCoverage(
    period: PeriodWithCoverageDates,
    coverage: { start?: string | null; end?: string | null }
): boolean {
    const start = normalizeCoverageBound(coverage.start, 'start')
    const end = normalizeCoverageBound(coverage.end, 'end')

    return (
        (!end || period.startDate <= end) && (!start || period.endDate >= start)
    )
}

export function filterPeriodsWithinCoverage<T extends PeriodWithCoverageDates>(
    periods: T[],
    coverageStart: string | null | undefined,
    coverageEnd: string | null | undefined
): T[] {
    const coverage = { start: coverageStart, end: coverageEnd }

    if (
        !normalizeCoverageBound(coverageStart, 'start') &&
        !normalizeCoverageBound(coverageEnd, 'end')
    ) {
        return periods
    }

    return periods.filter((period) => periodOverlapsCoverage(period, coverage))
}

export type GeneratedPeriod = {
    id: string
    name: string
    startDate: string
    endDate: string
}

export function generatePeriodsForYears(
    periodType: HandlerPeriodType,
    fromYear: number,
    toYear: number
): GeneratedPeriod[] {
    const periods: GeneratedPeriod[] = []
    for (let year = fromYear; year <= toYear; year += 1) {
        periods.push(
            ...(generateFixedPeriods({
                periodType: periodType.toUpperCase() as
                    | 'DAILY'
                    | 'WEEKLY'
                    | 'MONTHLY',
                calendar: 'iso8601',
                year,
            }) as GeneratedPeriod[])
        )
    }
    return periods
}
