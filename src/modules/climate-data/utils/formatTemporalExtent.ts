import i18n from '@dhis2/d2-i18n'
import type { ClimateTemporalExtent } from '@/capsApi/types'

const MISSING_BOUND = '—'

function formatBound(
    date: string,
    periodType: string | undefined,
    locale: string | undefined
): string {
    const parsed = new Date(`${date}T00:00:00Z`)
    if (Number.isNaN(parsed.getTime())) {
        return date
    }
    const year = parsed.getUTCFullYear()
    switch (periodType) {
        case 'monthly':
            return new Intl.DateTimeFormat(locale, {
                month: 'long',
                year: 'numeric',
                timeZone: 'UTC',
            }).format(parsed)
        case 'quarterly':
            return `${year} Q${Math.floor(parsed.getUTCMonth() / 3) + 1}`
        case 'yearly':
            return String(year)
        default:
            return date
    }
}

export function formatClimateTemporalExtent(
    temporal: ClimateTemporalExtent | undefined,
    periodType?: string,
    locale?: string
): string {
    const start = temporal?.start?.trim() || undefined
    const end = temporal?.end?.trim() || undefined
    if (!start && !end) {
        return i18n.t('n/a')
    }
    const format = (bound: string | undefined) =>
        bound ? formatBound(bound, periodType, locale) : MISSING_BOUND
    return `${format(start)} – ${format(end)}`
}
