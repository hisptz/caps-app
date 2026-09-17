import i18n from '@dhis2/d2-i18n'

/** Relative time for a past instant (e.g. "2 min ago", "just now"). */
export function formatPastRelative(
    timestampMs: number,
    nowMs = Date.now()
): string {
    const diffMs = Math.max(0, nowMs - timestampMs)
    const sec = Math.floor(diffMs / 1000)
    if (sec < 10) {
        return i18n.t('just now')
    }
    if (sec < 60) {
        return i18n.t('{{count}} sec ago', { count: sec })
    }
    const min = Math.floor(sec / 60)
    if (min < 60) {
        return i18n.t('{{count}} min ago', { count: min })
    }
    const hr = Math.floor(min / 60)
    if (hr < 48) {
        return i18n.t('{{count}} hr ago', { count: hr })
    }
    const days = Math.floor(hr / 24)
    return i18n.t('{{count}} days ago', { count: days })
}
