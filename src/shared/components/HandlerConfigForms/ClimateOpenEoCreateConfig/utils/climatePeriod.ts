import i18n from '@dhis2/d2-i18n'
import type { HandlerPeriodType } from './climateDatasetPeriodUtils'

/**
 * A climate step's period is fixed (`id` to `endId`) or rolling: `count` whole periods ending
 * `offset` periods before the one a run falls in, worked out by caps-engine when it runs.
 * `{ periodType: 'daily', lastDays }` is the earlier rolling form and reads as rolling daily.
 */
export type PeriodMode = 'fixed' | 'rolling'

type Period = Record<string, unknown> | null | undefined

/** Same caps as caps-engine's climateOpenEo config schema. */
export const MAX_ROLLING_COUNT: Record<HandlerPeriodType, number> = {
    daily: 400,
    weekly: 104,
    monthly: 36,
}

export const DEFAULT_ROLLING_COUNT: Record<HandlerPeriodType, number> = {
    daily: 35,
    weekly: 8,
    monthly: 3,
}

export const DEFAULT_ROLLING_OFFSET = 1

export const MAX_ROLLING_OFFSET = 366

export function periodModeOf(period: Period): PeriodMode {
    return period?.mode === 'rolling' || typeof period?.lastDays === 'number'
        ? 'rolling'
        : 'fixed'
}

export function rollingFieldsOf(period: Period): {
    count: number | undefined
    offset: number
} {
    if (typeof period?.lastDays === 'number') {
        return { count: period.lastDays, offset: DEFAULT_ROLLING_OFFSET }
    }
    return {
        count: typeof period?.count === 'number' ? period.count : undefined,
        offset:
            typeof period?.offset === 'number'
                ? period.offset
                : DEFAULT_ROLLING_OFFSET,
    }
}

/** The fixed fields of a period, dropping any rolling ones, so the two never mix. */
export function fixedPeriodFrom(period: Period): Record<string, unknown> {
    const fixed: Record<string, unknown> = {}
    for (const key of ['periodType', 'id', 'endId'] as const) {
        if (period?.[key] !== undefined) {
            fixed[key] = period[key]
        }
    }
    return fixed
}

export function rollingPeriod(
    periodType: HandlerPeriodType,
    count: number | undefined,
    offset: number
): Record<string, unknown> {
    return { mode: 'rolling', periodType, count, offset }
}

/** The period a step starts with after switching mode. */
export function periodForMode(
    mode: PeriodMode,
    periodType: HandlerPeriodType | undefined
): Record<string, unknown> {
    if (mode === 'fixed' || !periodType) {
        return periodType ? { periodType } : {}
    }
    return rollingPeriod(
        periodType,
        DEFAULT_ROLLING_COUNT[periodType],
        DEFAULT_ROLLING_OFFSET
    )
}

const DAY_MS = 24 * 60 * 60 * 1000

function startOfPeriod(date: Date, periodType: HandlerPeriodType): Date {
    const day = Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate()
    )
    if (periodType === 'daily') {
        return new Date(day)
    }
    if (periodType === 'weekly') {
        const isoWeekday = (new Date(day).getUTCDay() + 6) % 7 // Monday = 0
        return new Date(day - isoWeekday * DAY_MS)
    }
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
}

function shift(date: Date, periodType: HandlerPeriodType, n: number): Date {
    if (periodType === 'monthly') {
        return new Date(
            Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + n, 1)
        )
    }
    const days = periodType === 'weekly' ? 7 * n : n
    return new Date(date.getTime() + days * DAY_MS)
}

const isoDate = (date: Date) => date.toISOString().slice(0, 10)

/** The dates a rolling period covers for a run at `now`, as caps-engine works them out (UTC). */
export function rollingWindow(
    {
        periodType,
        count,
        offset,
    }: { periodType: HandlerPeriodType; count: number; offset: number },
    now: Date = new Date()
): [string, string] {
    const last = shift(startOfPeriod(now, periodType), periodType, -offset)
    const first = shift(last, periodType, -(count - 1))
    const end = new Date(shift(last, periodType, 1).getTime() - DAY_MS)
    return [isoDate(first), isoDate(end)]
}

/**
 * The last day of the period a dataset's time step falls in. A collection's temporal extent
 * gives the timestamp of its last step, labelled by the first day of the period, so a monthly
 * collection ending `2026-09-01` holds all of September.
 */
export function lastDayOfPeriod(
    date: string,
    periodType: HandlerPeriodType
): string | undefined {
    const parsed = new Date(`${date}T00:00:00Z`)
    if (Number.isNaN(parsed.getTime())) {
        return undefined
    }
    const next = shift(startOfPeriod(parsed, periodType), periodType, 1)
    return isoDate(new Date(next.getTime() - DAY_MS))
}

/**
 * The step form's check of a climate period, with field-level messages. caps-engine publishes
 * the period as a union, whose JSON schema errors land on `period` rather than on the field
 * that is missing. Path is relative to `period`.
 */
export function climatePeriodIssue(
    period: Period
): { path: string[]; message: string } | null {
    if (periodModeOf(period) === 'fixed') {
        return typeof period?.id === 'string' && period.id !== ''
            ? null
            : { path: ['id'], message: i18n.t('Select a start period') }
    }
    const periodType = period?.periodType as HandlerPeriodType | undefined
    const { count, offset } = rollingFieldsOf(period)
    const countPath =
        typeof period?.lastDays === 'number' ? 'lastDays' : 'count'
    if (count === undefined || !Number.isInteger(count) || count < 1) {
        return {
            path: [countPath],
            message: i18n.t('Enter how many periods to cover'),
        }
    }
    if (periodType && count > MAX_ROLLING_COUNT[periodType]) {
        return {
            path: [countPath],
            message: i18n.t('At most {{max}}', {
                max: MAX_ROLLING_COUNT[periodType],
            }),
        }
    }
    if (
        !Number.isInteger(offset) ||
        offset < 0 ||
        offset > MAX_ROLLING_OFFSET
    ) {
        return {
            path: ['offset'],
            message: i18n.t('Enter 0 to {{max}}', { max: MAX_ROLLING_OFFSET }),
        }
    }
    return null
}

const UNIT: Record<HandlerPeriodType, string> = {
    daily: 'days',
    weekly: 'weeks',
    monthly: 'months',
}

/** A step's own period in a few words, for a run or schedule that leaves it unchanged. */
export function describePeriod(period: Period): string | undefined {
    const periodType = period?.periodType as HandlerPeriodType | undefined
    if (!periodType || !(periodType in UNIT)) {
        return undefined
    }
    if (periodModeOf(period) === 'rolling') {
        const { count, offset } = rollingFieldsOf(period)
        if (count === undefined) {
            return undefined
        }
        return offset === DEFAULT_ROLLING_OFFSET
            ? i18n.t('Latest periods: the last {{count}} complete {{unit}}', {
                  count,
                  unit: i18n.t(UNIT[periodType]),
              })
            : i18n.t(
                  'Latest periods: {{count}} {{unit}}, skipping the most recent {{offset}}',
                  { count, offset, unit: i18n.t(UNIT[periodType]) }
              )
    }
    if (typeof period?.id !== 'string' || period.id === '') {
        return undefined
    }
    return typeof period.endId === 'string' && period.endId !== ''
        ? i18n.t('Fixed range: {{start}} to {{end}}', {
              start: period.id,
              end: period.endId,
          })
        : i18n.t('Fixed range: {{start}}', { start: period.id })
}

/** `climatePeriodIssue` for a run or schedule override, which may leave the period out. */
export function climateContextPeriodIssue(
    context: Record<string, unknown>
): { path: string[]; message: string } | null {
    const period = context.period as Record<string, unknown> | undefined
    if (period === undefined) {
        return null
    }
    const issue = climatePeriodIssue(period)
    return issue ? { ...issue, path: ['period', ...issue.path] } : null
}

/**
 * The latest-periods override a schedule starts with: the step's own when it rolls, otherwise
 * the defaults for the step's period type.
 */
export function scheduleRollingPeriod(
    stepPeriod: Period
): Record<string, unknown> {
    const periodType =
        (stepPeriod?.periodType as HandlerPeriodType | undefined) ?? 'daily'
    if (periodModeOf(stepPeriod) === 'rolling') {
        const { count, offset } = rollingFieldsOf(stepPeriod)
        return rollingPeriod(periodType, count, offset)
    }
    return periodForMode('rolling', periodType)
}

/**
 * A schedule uses the step's period (no override) or latest periods; a fixed range would
 * cover the same dates on every scheduled run.
 */
export function scheduleContextPeriodIssue(
    context: Record<string, unknown>
): { path: string[]; message: string } | null {
    if (
        context.period !== undefined &&
        periodModeOf(context.period as Period) !== 'rolling'
    ) {
        return {
            path: ['period', 'count'],
            message: i18n.t(
                'Scheduled runs use the step’s period or latest periods, not a fixed range'
            ),
        }
    }
    return climateContextPeriodIssue(context)
}
