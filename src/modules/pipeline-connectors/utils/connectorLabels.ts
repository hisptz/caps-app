import i18n from '@dhis2/d2-i18n'
import { formatDate } from '@/modules/pipeline-detail/utils/formatLabels'
import type {
    ConnectorRun,
    ConnectorTriggerOn,
    PipelineConnector,
} from '@/shared/types/caps'

export const NO_ESCAPE = { interpolation: { escapeValue: false } } as const
const ON_LABELS: Record<ConnectorTriggerOn, () => string> = {
    COMPLETED: () => i18n.t('When it succeeds'),
    FAILED: () => i18n.t('When it fails'),
    FINISHED: () => i18n.t('When it finishes (either way)'),
}

export function formatDelay(minutes: number): string {
    if (minutes <= 0) {
        return ''
    }
    if (minutes % (24 * 60) === 0) {
        return i18n.t('{{count}} day(s)', { count: minutes / (24 * 60) })
    }
    if (minutes % 60 === 0) {
        return i18n.t('{{count}} hour(s)', { count: minutes / 60 })
    }
    return i18n.t('{{count}} min', { count: minutes })
}

/** "When it succeeds", "When it fails, wait 2 hour(s)" */
export function describeConnectorTrigger(
    connector: Pick<PipelineConnector, 'on' | 'delayMinutes'>
): string {
    const when = ON_LABELS[connector.on]()
    const delay = formatDelay(connector.delayMinutes)
    return delay
        ? i18n.t('{{when}}, wait {{delay}}', { when, delay, ...NO_ESCAPE })
        : when
}

/** When a connector run was decided, or when it will be checked if still waiting. */
export function describeConnectorRunTime(
    run: Pick<ConnectorRun, 'status' | 'checkAt' | 'evaluatedAt'>
): string {
    return run.status === 'WAITING'
        ? i18n.t('Checks at {{date}}', {
              date: formatDate(run.checkAt),
              ...NO_ESCAPE,
          })
        : formatDate(run.evaluatedAt)
}
