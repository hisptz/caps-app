import i18n from '@dhis2/d2-i18n'
import classes from './Flow.module.css'
import type {
    ConnectorRunStatus,
    MergeRunStatus,
    PipelineExecutionStatus,
} from '@/shared/types/caps'

export type FlowStatus = {
    /** Status class on the node: running, succeeded, failed, waiting, or none */
    tone: string | undefined
    label: string
}

/** How a pipeline's run in the latest workflow run looks on its node. */
export function pipelineFlowStatus(
    status: PipelineExecutionStatus | undefined
): FlowStatus {
    switch (status) {
        case undefined:
            return { tone: undefined, label: i18n.t('Not run') }
        case 'PENDING':
        case 'RUNNING':
        case 'AWAITING_STEP':
            return { tone: classes.running, label: i18n.t('Running') }
        case 'COMPLETED':
            return { tone: classes.succeeded, label: i18n.t('Succeeded') }
        case 'FAILED':
            return { tone: classes.failed, label: i18n.t('Failed') }
        case 'CANCELLED':
            return { tone: classes.failed, label: i18n.t('Cancelled') }
        default:
            return { tone: undefined, label: status }
    }
}

/** How a merge's decision in the latest workflow run looks on its node. */
export function mergeFlowStatus(
    status: MergeRunStatus | undefined,
    arrived: number,
    total: number
): FlowStatus {
    switch (status) {
        case undefined:
            return { tone: undefined, label: i18n.t('Not run') }
        case 'WAITING':
            return {
                tone: classes.waiting,
                label: i18n.t('Waiting {{arrived}}/{{total}}', {
                    arrived,
                    total,
                }),
            }
        case 'FIRED':
            return { tone: classes.succeeded, label: i18n.t('Started next') }
        case 'NOT_MET':
            return { tone: undefined, label: i18n.t('Condition not met') }
        case 'TIMED_OUT':
            return { tone: classes.failed, label: i18n.t('Timed out') }
        case 'FAILED':
            return { tone: classes.failed, label: i18n.t('Failed') }
        default:
            return { tone: undefined, label: i18n.t('Did not start next') }
    }
}

/** How a connector's decision in the latest workflow run looks on its diamond. */
export function connectorFlowStatus(
    run: { status: ConnectorRunStatus; startedOtherwise: boolean } | undefined
): FlowStatus {
    switch (run?.status) {
        case undefined:
            return { tone: undefined, label: i18n.t('Not run') }
        case 'WAITING':
            return { tone: classes.waiting, label: i18n.t('Waiting') }
        case 'FIRED':
            return {
                tone: classes.succeeded,
                label: run.startedOtherwise
                    ? i18n.t('Took otherwise')
                    : i18n.t('Started next'),
            }
        case 'NOT_MET':
            return { tone: undefined, label: i18n.t('Condition not met') }
        case 'FAILED':
            return { tone: classes.failed, label: i18n.t('Failed') }
        default:
            return { tone: undefined, label: i18n.t('Did not start next') }
    }
}
