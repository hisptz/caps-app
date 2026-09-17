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
