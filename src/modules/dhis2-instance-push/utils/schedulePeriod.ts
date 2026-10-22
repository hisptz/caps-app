import i18n from '@dhis2/d2-i18n'
import type { PushPeriod } from '@/modules/dhis2-instance-push/schemas/config'

/** A one-line summary of a push step's period, for the run and schedule forms. */
export function describePushPeriod(
    period: PushPeriod | undefined
): string | undefined {
    switch (period?.mode) {
        case 'updated':
            return i18n.t('Values updated in the last {{days}} days', {
                days: period.days,
            })
        case 'relative':
            return i18n.t(
                'Latest periods: {{count}}, skipping the most recent {{offset}}',
                { count: period.count, offset: period.offset }
            )
        case 'fixed':
            return period.start && period.end
                ? i18n.t('Fixed range: {{start}} to {{end}}', {
                      start: period.start,
                      end: period.end,
                  })
                : undefined
        default:
            return undefined
    }
}

/** Schedules take recently updated values or latest periods, not a fixed range. */
export function schedulePushPeriodIssue(
    context: Record<string, unknown>
): { path: string[]; message: string } | null {
    const period = context.period as { mode?: string } | undefined
    if (period?.mode !== 'fixed') {
        return null
    }
    return {
        path: ['period', 'mode'],
        message: i18n.t(
            'Scheduled runs push the step’s values, recently updated values or latest periods, not a fixed range'
        ),
    }
}
