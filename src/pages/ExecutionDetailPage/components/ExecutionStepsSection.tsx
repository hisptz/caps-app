import i18n from '@dhis2/d2-i18n'
import React from 'react'
import classes from '../ExecutionDetailPage.module.css'
import { ExecutionStepCard } from './ExecutionStepCard'
import type { StepExecution, TaskExecution } from '@/shared/types/caps'

type Props = {
    stepExecutions: StepExecution[]
    idPrefix: string
    expandedSteps: Set<string>
    expandedTasks: Set<string>
    onToggleStep: (stepId: string) => void
    onToggleTask: (taskId: string) => void
    onViewTaskError: (task: TaskExecution) => void
    onRetryClick: (
        stepExecution: StepExecution,
        triggerEl: HTMLElement | null
    ) => void
}

export function ExecutionStepsSection({
    stepExecutions,
    idPrefix,
    expandedSteps,
    expandedTasks,
    onToggleStep,
    onToggleTask,
    onViewTaskError,
    onRetryClick,
}: Props): React.ReactElement {
    return (
        <section className={classes.section}>
            <h3>{i18n.t('Step Executions')}</h3>
            {stepExecutions.length === 0 ? (
                <p className={classes.muted}>
                    {i18n.t('No step executions yet.')}
                </p>
            ) : (
                <div className={classes.stepList}>
                    {stepExecutions.map((se) => (
                        <ExecutionStepCard
                            key={se.id}
                            stepExecution={se}
                            panelId={`${idPrefix}-panel-${se.id}`}
                            isExpanded={expandedSteps.has(se.id)}
                            onToggle={() => onToggleStep(se.id)}
                            expandedTasks={expandedTasks}
                            onToggleTask={onToggleTask}
                            onViewTaskError={onViewTaskError}
                            onRetryClick={(triggerEl) =>
                                onRetryClick(se, triggerEl)
                            }
                        />
                    ))}
                </div>
            )}
        </section>
    )
}
