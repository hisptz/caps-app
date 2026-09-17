import i18n from '@dhis2/d2-i18n'
import type { ClimateTemporalExtent } from '@/capsApi/types'

const MISSING_BOUND = '—'

export function formatClimateTemporalExtent(
    temporal: ClimateTemporalExtent | undefined
): string {
    const start = temporal?.start?.trim() || undefined
    const end = temporal?.end?.trim() || undefined
    if (!start && !end) {
        return i18n.t('n/a')
    }
    return `${start ?? MISSING_BOUND} – ${end ?? MISSING_BOUND}`
}
