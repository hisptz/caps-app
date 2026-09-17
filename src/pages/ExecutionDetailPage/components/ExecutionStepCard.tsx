import i18n from '@dhis2/d2-i18n'
import {
    Button,
    IconChevronDown16,
    IconChevronRight16,
    IconSync16,
    NoticeBox,
} from '@dhis2/ui'
import React, { useRef } from 'react'
import classes from '../ExecutionDetailPage.module.css'
import { IoJsonGrid } from './IoJsonGrid'
import { TaskExecutionsTable } from './TaskExecutionsTable'
import {
    durationLabel,
    formatDate,
} from '@/modules/pipeline-detail/utils/formatLabels'
import { StatusTag } from '@/shared/components/ui/StatusTag'
import type { StepExecution, TaskExecution } from '@/shared/types/caps'

type Props = {
    stepExecution: StepExecution
    panelId: string
    isExpanded: boolean
    onToggle: () => void
    expandedTasks: Set<string>
    onToggleTask: (taskId: string) => void
    onViewTaskError: (task: TaskExecution) => void
    onRetryClick: (triggerEl: HTMLElement | null) => void
}

export function ExecutionStepCard({
    stepExecution: se,
    panelId,
    isExpanded,
    onToggle,
    expandedTasks,
    onToggleTask,
    onViewTaskError,
    onRetryClick,
}: Props): React.ReactElement {
    const retryButtonWrapRef = useRef<HTMLSpanElement | null>(null)
    const stepTitle = i18n.t('Step {{order}} — {{name}}', {
        order: se.step?.stepOrder != null ? String(se.step.stepOrder + 1) : '?',
        name: String(se.step?.name ?? se.stepId),
    })
    const canRetry = Boolean(se.retryable)

    return (
        <div className={classes.stepCard}>
            <div className={classes.stepHeaderRow}>
                <button
                    type="button"
                    className={classes.stepHeader}
                    aria-expanded={isExpanded}
                    aria-controls={panelId}
                    onClick={onToggle}
                >
                    <span className={classes.stepToggleIcon} aria-hidden>
                        {isExpanded ? (
                            <IconChevronDown16 />
                        ) : (
                            <IconChevronRight16 />
                        )}
                    </span>
                    <span className={classes.stepName}>{stepTitle}</span>
                    <StatusTag status={se.status} />
                    <span className={classes.stepMeta}>
                        {i18n.t('Attempt {{n}}', {
                            n: String(se.attemptNumber),
                        })}
                    </span>
                    <span className={classes.stepMeta}>
                        {formatDate(se.startedAt)}
                    </span>
                    <span className={classes.stepMeta}>
                        {durationLabel(se.startedAt, se.finishedAt)}
                    </span>
                </button>
                {canRetry && (
                    <span
                        ref={retryButtonWrapRef}
                        className={classes.stepRetryAction}
                    >
                        <Button
                            small
                            icon={<IconSync16 />}
                            onClick={() =>
                                onRetryClick(retryButtonWrapRef.current)
                            }
                        >
                            {i18n.t('Retry step')}
                        </Button>
                    </span>
                )}
            </div>

            {isExpanded && (
                <div id={panelId} className={classes.stepBody}>
                    {se.errorMessage && (
                        <NoticeBox error title={i18n.t('Step failed')}>
                            {se.errorMessage}
                        </NoticeBox>
                    )}

                    <IoJsonGrid input={se.input} output={se.output} />

                    {se.taskExecutions && se.taskExecutions.length > 0 && (
                        <TaskExecutionsTable
                            tasks={se.taskExecutions}
                            expandedTasks={expandedTasks}
                            onToggleTask={onToggleTask}
                            onViewTaskError={onViewTaskError}
                        />
                    )}
                </div>
            )}
        </div>
    )
}
