import i18n from '@dhis2/d2-i18n'
import { NO_ESCAPE } from '@/modules/pipeline-connectors/utils/connectorLabels'
import { formatDate } from '@/modules/pipeline-detail/utils/formatLabels'
import type {
    PipelineMerge,
    RunPeriodRange,
    Workflow,
} from '@/shared/types/caps'

export function describeWorkflowSchedule(
    workflow: Pick<Workflow, 'cronExpr' | 'nextRunAt' | 'isActive'>
): string {
    if (!workflow.cronExpr) {
        return i18n.t('Started by hand only')
    }
    if (!workflow.isActive || !workflow.nextRunAt) {
        return workflow.cronExpr
    }
    return i18n.t('{{cron}} · next {{next}}', {
        cron: workflow.cronExpr,
        next: formatDate(workflow.nextRunAt),
        interpolation: NO_ESCAPE,
    })
}

export function formatWorkflowTrigger(triggeredBy: string): string {
    switch (triggeredBy) {
        case 'scheduler':
            return i18n.t('Schedule')
        case 'api':
            return i18n.t('Run button')
        default:
            return triggeredBy
    }
}

/** "All succeeded · 24 h" */
export function formatMergeRule(
    merge: Pick<PipelineMerge, 'triggerRule' | 'timeoutMinutes'>
): string {
    const rule =
        merge.triggerRule === 'ALL_DONE'
            ? i18n.t('All done')
            : i18n.t('All succeeded')
    const hours = merge.timeoutMinutes / 60
    const limit = Number.isInteger(hours)
        ? i18n.t('{{hours}} h', { hours })
        : i18n.t('{{minutes}} min', { minutes: merge.timeoutMinutes })
    return `${rule} · ${limit}`
}

/** "2020W1 – 2026W43" for a run over a fixed range. */
export function formatRunPeriod(period: RunPeriodRange): string {
    return period.start === period.end
        ? period.start
        : `${period.start} – ${period.end}`
}
