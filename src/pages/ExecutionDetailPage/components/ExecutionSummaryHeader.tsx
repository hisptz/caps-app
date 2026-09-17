import i18n from '@dhis2/d2-i18n'
import {
    Button,
    ButtonStrip,
    Help,
    IconArrowLeft16,
    IconBlock16,
    IconCross16,
    IconSync16,
} from '@dhis2/ui'
import React from 'react'
import classes from '../ExecutionDetailPage.module.css'
import type { ExecutionDetailResponse } from '@/capsApi/types'
import {
    durationLabel,
    formatDate,
} from '@/modules/pipeline-detail/utils/formatLabels'
import { StatusGlyph, StatusTag } from '@/shared/components/ui/StatusTag'

type Props = {
    execution: ExecutionDetailResponse
    canPause: boolean
    canResume: boolean
    canCancel: boolean
    isTerminal: boolean
    hasRetryableStep: boolean
    isPausing: boolean
    isResuming: boolean
    onNavigateBack: () => void
    onPause: () => void
    onResume: () => void
    onCancel: () => void
}

export function ExecutionSummaryHeader({
    execution,
    canPause,
    canResume,
    canCancel,
    isTerminal,
    hasRetryableStep,
    isPausing,
    isResuming,
    onNavigateBack,
    onPause,
    onResume,
    onCancel,
}: Props): React.ReactElement {
    return (
        <>
            <div className={classes.breadcrumb}>
                <Button
                    small
                    icon={<IconArrowLeft16 />}
                    onClick={onNavigateBack}
                >
                    {i18n.t('Executions')}
                </Button>
                <span className={classes.breadcrumbSep}>/</span>
                <span className={classes.breadcrumbExecutionId}>
                    <StatusGlyph status={execution.status} />
                    <code>{execution.id}</code>
                </span>
            </div>

            <div className={classes.summaryCard}>
                <div className={classes.summaryMain}>
                    <div className={classes.summaryStatus}>
                        <StatusTag status={execution.status} />
                    </div>
                    <dl className={classes.summaryMeta}>
                        <div className={classes.summaryRow}>
                            <dt>{i18n.t('Pipeline')}</dt>
                            <dd>
                                {execution.pipeline?.name ??
                                    execution.pipelineId}
                            </dd>
                        </div>
                        <div className={classes.summaryRow}>
                            <dt>{i18n.t('Triggered By')}</dt>
                            <dd>{execution.triggeredBy ?? '—'}</dd>
                        </div>
                        <div className={classes.summaryRow}>
                            <dt>{i18n.t('Started At')}</dt>
                            <dd>{formatDate(execution.startedAt)}</dd>
                        </div>
                        <div className={classes.summaryRow}>
                            <dt>{i18n.t('Finished At')}</dt>
                            <dd>{formatDate(execution.finishedAt)}</dd>
                        </div>
                        <div className={classes.summaryRow}>
                            <dt>{i18n.t('Duration')}</dt>
                            <dd>
                                {durationLabel(
                                    execution.startedAt,
                                    execution.finishedAt
                                )}
                            </dd>
                        </div>
                        <div className={classes.summaryRow}>
                            <dt>{i18n.t('Current Step')}</dt>
                            <dd>
                                {execution.currentStepIndex < 0
                                    ? '—'
                                    : execution.currentStepIndex + 1}
                            </dd>
                        </div>
                    </dl>
                </div>
                <div className={classes.actionColumn}>
                    <ButtonStrip>
                        <Button
                            icon={<IconBlock16 />}
                            disabled={!canPause || isPausing}
                            loading={isPausing}
                            onClick={onPause}
                        >
                            {i18n.t('Pause')}
                        </Button>
                        <Button
                            icon={<IconSync16 />}
                            disabled={!canResume || isResuming}
                            loading={isResuming}
                            onClick={onResume}
                        >
                            {i18n.t('Resume')}
                        </Button>
                        <Button
                            destructive
                            icon={<IconCross16 />}
                            disabled={!canCancel}
                            onClick={onCancel}
                        >
                            {i18n.t('Cancel')}
                        </Button>
                    </ButtonStrip>
                    {isTerminal && (
                        <div className={classes.actionHelp}>
                            <Help>
                                {hasRetryableStep
                                    ? i18n.t(
                                          'This execution failed. Use Retry step on the failed attempt below to continue from that step.'
                                      )
                                    : i18n.t(
                                          'This execution has finished; pause, resume, and cancel are not available.'
                                      )}
                            </Help>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}
