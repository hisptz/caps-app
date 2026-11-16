import i18n from '@dhis2/d2-i18n'
import { CronExpressionParser } from 'cron-parser'

export interface CronChunks {
    /** Up to 5 entries, raw strings from the expression. */
    fields: string[]
    /** True iff the expression has exactly 5 fields and each token is syntactically plausible. */
    valid: boolean
}

const CRON_FIELD_RE =
    /^(\*|\*\/\d+|\d+(-\d+)?(\/\d+)?)(,(\*|\*\/\d+|\d+(-\d+)?(\/\d+)?))*$/

/** Browser / host IANA timezone for schedule previews. */
export function getLocalTimezone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
}

function resolveTimezone(tz?: string): string {
    return tz ?? getLocalTimezone()
}

function isPlausibleCronToken(token: string): boolean {
    if (!token.trim()) {
        return false
    }
    return CRON_FIELD_RE.test(token.trim())
}

export function splitCronExpression(expr: string): CronChunks {
    const trimmed = expr.trim()
    if (!trimmed) {
        return { fields: [], valid: false }
    }
    const fields = trimmed.split(/\s+/)
    const valid =
        fields.length === 5 && fields.every((f) => isPlausibleCronToken(f))
    return { fields, valid }
}

function formatLocalDateTime(d: Date, tz: string): string {
    try {
        return new Intl.DateTimeFormat(undefined, {
            timeZone: tz,
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        }).format(d)
    } catch {
        return d.toISOString()
    }
}

function relativeFromNow(target: Date, now: Date): string {
    const diffMs = target.getTime() - now.getTime()
    if (diffMs < 0) {
        return i18n.t('in the past')
    }
    const sec = Math.floor(diffMs / 1000)
    if (sec < 60) {
        return i18n.t('in {{count}} sec', { count: sec })
    }
    const min = Math.floor(sec / 60)
    if (min < 60) {
        return i18n.t('in {{count}} min', { count: min })
    }
    const hr = Math.floor(min / 60)
    if (hr < 48) {
        return i18n.t('in {{count}} hr', { count: hr })
    }
    const days = Math.floor(hr / 24)
    return i18n.t('in {{count}} days', { count: days })
}

/** Returns a sentence describing the next cron firing in the given or local timezone. */
export function describeCron(expr: string, tz?: string): string {
    const resolvedTz = resolveTimezone(tz)
    const { valid } = splitCronExpression(expr)
    if (!valid) {
        return i18n.t('Invalid cron expression')
    }
    try {
        const interval = CronExpressionParser.parse(expr.trim(), {
            tz: resolvedTz,
        })
        const next = interval.next().toDate()
        const local = formatLocalDateTime(next, resolvedTz)
        return i18n.t('Next run {{local}} ({{tz}})', {
            local,
            tz: resolvedTz,
            // Timezone names hold a "/" that would otherwise show as &#x2F;
            interpolation: { escapeValue: false },
        })
    } catch {
        return i18n.t('Could not parse cron expression')
    }
}

export interface CronRunPreview {
    iso: string
    local: string
    relative: string
}

/** Returns the next N firings of the expression in the given or local timezone. */
export function nextCronRuns(
    expr: string,
    tz: string | undefined,
    n: number
): CronRunPreview[] {
    const resolvedTz = resolveTimezone(tz)
    const { valid } = splitCronExpression(expr)
    if (!valid || n < 1) {
        return []
    }
    try {
        const interval = CronExpressionParser.parse(expr.trim(), {
            tz: resolvedTz,
        })
        const now = new Date()
        const out: CronRunPreview[] = []
        for (let i = 0; i < n; i++) {
            const d = interval.next().toDate()
            out.push({
                iso: d.toISOString(),
                local: formatLocalDateTime(d, resolvedTz),
                relative: relativeFromNow(d, now),
            })
        }
        return out
    } catch {
        return []
    }
}

// ============================================================
// Simple schedules: the shapes the schedule picker builds and reads back.
// Anything else is a custom cron expression.
// ============================================================

export type ScheduleKind = 'hourly' | 'daily' | 'weekly' | 'monthly'

export type SimpleSchedule =
    | { kind: 'hourly'; minute: number }
    | { kind: 'daily'; hour: number; minute: number }
    | { kind: 'weekly'; days: number[]; hour: number; minute: number }
    | { kind: 'monthly'; day: number; hour: number; minute: number }

/** Cron weekday numbers in the order a week is shown: Monday first, Sunday (0) last. */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0] as const

function wholeNumber(token: string, min: number, max: number): number | null {
    if (!/^\d+$/.test(token)) {
        return null
    }
    const n = Number(token)
    return n >= min && n <= max ? n : null
}

/** "1-5", "1,3,5", "0,6" or "7" → cron weekdays 0–6; null for steps or anything else. */
function parseWeekdays(token: string): number[] | null {
    const days = new Set<number>()
    for (const part of token.split(',')) {
        const range = part.match(/^(\d+)-(\d+)$/)
        if (range) {
            const from = wholeNumber(range[1]!, 0, 7)
            const to = wholeNumber(range[2]!, 0, 7)
            if (from === null || to === null || from > to) {
                return null
            }
            for (let d = from; d <= to; d++) {
                days.add(d % 7)
            }
            continue
        }
        const day = wholeNumber(part, 0, 7)
        if (day === null) {
            return null
        }
        days.add(day % 7)
    }
    return [...days].sort(
        (a, b) =>
            WEEK_ORDER.indexOf(a as (typeof WEEK_ORDER)[number]) -
            WEEK_ORDER.indexOf(b as (typeof WEEK_ORDER)[number])
    )
}

/** The picker's reading of a cron expression; null when only "Custom" can show it. */
export function parseSimpleSchedule(expr: string): SimpleSchedule | null {
    const { fields, valid } = splitCronExpression(expr)
    if (!valid) {
        return null
    }
    const [m, h, dom, mon, dow] = fields as [
        string,
        string,
        string,
        string,
        string,
    ]
    const minute = wholeNumber(m, 0, 59)
    if (minute === null || mon !== '*') {
        return null
    }
    if (h === '*') {
        return dom === '*' && dow === '*' ? { kind: 'hourly', minute } : null
    }
    const hour = wholeNumber(h, 0, 23)
    if (hour === null) {
        return null
    }
    if (dom === '*' && dow === '*') {
        return { kind: 'daily', hour, minute }
    }
    if (dom === '*') {
        const days = parseWeekdays(dow)
        if (!days) {
            return null
        }
        return days.length === 7
            ? { kind: 'daily', hour, minute }
            : { kind: 'weekly', days, hour, minute }
    }
    if (dow === '*') {
        const day = wholeNumber(dom, 1, 31)
        return day === null ? null : { kind: 'monthly', day, hour, minute }
    }
    return null
}

/** Weekdays as cron writes them, joining runs of days: [1,2,3,4,5] → "1-5". */
function formatWeekdays(days: number[]): string {
    const sorted = [...new Set(days.map((d) => d % 7))].sort((a, b) => a - b)
    const parts: string[] = []
    let i = 0
    while (i < sorted.length) {
        let j = i
        while (j + 1 < sorted.length && sorted[j + 1] === sorted[j]! + 1) {
            j++
        }
        parts.push(
            j - i >= 2
                ? `${sorted[i]}-${sorted[j]}`
                : sorted.slice(i, j + 1).join(',')
        )
        i = j + 1
    }
    return parts.join(',')
}

export function buildCron(schedule: SimpleSchedule): string {
    switch (schedule.kind) {
        case 'hourly':
            return `${schedule.minute} * * * *`
        case 'daily':
            return `${schedule.minute} ${schedule.hour} * * *`
        case 'weekly':
            return schedule.days.length === 0 || schedule.days.length >= 7
                ? `${schedule.minute} ${schedule.hour} * * *`
                : `${schedule.minute} ${schedule.hour} * * ${formatWeekdays(schedule.days)}`
        case 'monthly':
            return `${schedule.minute} ${schedule.hour} ${schedule.day} * *`
    }
}

/** Switching the picker to another kind keeps the chosen time where it can. */
export function scheduleOfKind(
    kind: ScheduleKind,
    from: SimpleSchedule | null
): SimpleSchedule {
    const minute = from?.minute ?? 0
    const hour = from && 'hour' in from ? from.hour : 6
    switch (kind) {
        case 'hourly':
            return { kind, minute }
        case 'daily':
            return { kind, hour, minute }
        case 'weekly':
            return {
                kind,
                hour,
                minute,
                days: from?.kind === 'weekly' ? from.days : [1],
            }
        case 'monthly':
            return {
                kind,
                hour,
                minute,
                day: from?.kind === 'monthly' ? from.day : 1,
            }
    }
}

export function formatTime(hour: number, minute: number): string {
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

/** "06:30" → { hour: 6, minute: 30 }; null for anything else. */
export function parseTime(
    value: string
): { hour: number; minute: number } | null {
    const match = value.match(/^(\d{1,2}):(\d{2})$/)
    if (!match) {
        return null
    }
    const hour = wholeNumber(match[1]!, 0, 23)
    const minute = wholeNumber(match[2]!, 0, 59)
    return hour === null || minute === null ? null : { hour, minute }
}

export function weekdayName(day: number): string {
    return [
        i18n.t('Sunday'),
        i18n.t('Monday'),
        i18n.t('Tuesday'),
        i18n.t('Wednesday'),
        i18n.t('Thursday'),
        i18n.t('Friday'),
        i18n.t('Saturday'),
    ][day % 7]!
}

export function weekdayShortName(day: number): string {
    return [
        i18n.t('Sun'),
        i18n.t('Mon'),
        i18n.t('Tue'),
        i18n.t('Wed'),
        i18n.t('Thu'),
        i18n.t('Fri'),
        i18n.t('Sat'),
    ][day % 7]!
}

function listWords(words: string[]): string {
    if (words.length <= 1) {
        return words.join('')
    }
    return i18n.t('{{list}} and {{last}}', {
        list: words.slice(0, -1).join(', '),
        last: words.at(-1),
    })
}

/**
 * What a schedule means in words, e.g. "Every Monday and Thursday at 06:00". Custom
 * expressions the picker cannot read get a general line; the next runs say the rest.
 */
export function describeScheduleInWords(expr: string): string {
    if (!splitCronExpression(expr).valid) {
        return i18n.t('Not a valid schedule yet')
    }
    const schedule = parseSimpleSchedule(expr)
    if (!schedule) {
        return i18n.t('Custom schedule; see the next runs below')
    }
    switch (schedule.kind) {
        case 'hourly':
            return schedule.minute === 0
                ? i18n.t('Every hour, on the hour')
                : i18n.t('Every hour at {{minute}} minutes past', {
                      minute: schedule.minute,
                  })
        case 'daily':
            return i18n.t('Every day at {{time}}', {
                time: formatTime(schedule.hour, schedule.minute),
            })
        case 'weekly': {
            const time = formatTime(schedule.hour, schedule.minute)
            const key = schedule.days.join(',')
            if (key === '1,2,3,4,5') {
                return i18n.t('Every weekday (Monday to Friday) at {{time}}', {
                    time,
                })
            }
            if (key === '6,0') {
                return i18n.t('Every Saturday and Sunday at {{time}}', { time })
            }
            return i18n.t('Every {{days}} at {{time}}', {
                days: listWords(schedule.days.map(weekdayName)),
                time,
            })
        }
        case 'monthly': {
            const time = formatTime(schedule.hour, schedule.minute)
            return schedule.day > 28
                ? i18n.t(
                      'On day {{day}} of every month at {{time}}; months without that day are skipped',
                      { day: schedule.day, time }
                  )
                : i18n.t('On day {{day}} of every month at {{time}}', {
                      day: schedule.day,
                      time,
                  })
        }
    }
}
