import { useAlert, useDataEngine } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import { Button, NoticeBox } from '@dhis2/ui'
import React, { useId, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { CancelExecutionModal } from './components/CancelExecutionModal'
import { ExecutionLogsSection } from './components/ExecutionLogsSection'
import { ExecutionStepsSection } from './components/ExecutionStepsSection'
import { ExecutionSummaryHeader } from './components/ExecutionSummaryHeader'
import { RetryStepModal } from './components/RetryStepModal'
import { TaskErrorModal } from './components/TaskErrorModal'
import classes from './ExecutionDetailPage.module.css'
import { CapsApiError } from '@/capsApi/client'
import { isUuid } from '@/capsApi/isUuid'
import { useExecutionDetailQuery } from '@/modules/monitoring/hooks/capsMonitoringHooks'
import { useExecutionLifecycleActions } from '@/modules/monitoring/hooks/useExecutionLifecycleActions'
import {
    mapRetryStepError,
    useRetryStepExecutionMutation,
} from '@/modules/monitoring/hooks/useRetryStepExecutionMutation'
import { PageLoader } from '@/shared/components/ui/PageLoader'
import shellClasses from '@/shared/components/ui/PageShell/PageShell.module.css'
import type { StepExecution, TaskExecution } from '@/shared/types/caps'

type AlertShowProps = { text: string; error?: boolean; success?: boolean }

const ExecutionDetailPage: React.FC = () => {
    const engine = useDataEngine()
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set())
    const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())
    const [taskError, setTaskError] = useState<TaskExecution | null>(null)
    const [showCancelConfirm, setShowCancelConfirm] = useState(false)
    const [retryTarget, setRetryTarget] = useState<StepExecution | null>(null)
    const [retryError, setRetryError] = useState<string | null>(null)
    const [retryIdempotencyKey, setRetryIdempotencyKey] = useState<
        string | null
    >(null)
    const retryTriggerRef = useRef<HTMLElement | null>(null)
    const uid = useId()
    const { show } = useAlert(
        ({ text }: AlertShowProps) => text,
        ({ error, success }: AlertShowProps) => ({
            error: Boolean(error),
            success: Boolean(success),
        })
    )

    const idReady = isUuid(id)

    const {
        data: execution,
        isLoading,
        isError,
        error,
    } = useExecutionDetailQuery(engine, id)

    const retryMutation = useRetryStepExecutionMutation(engine, id)
    const { pause, resume, cancel, isPausing, isResuming, isCancelling } =
        useExecutionLifecycleActions(engine, id)

    const toggleTask = (taskId: string) => {
        setExpandedTasks((prev) => {
            const next = new Set(prev)
            if (next.has(taskId)) {
                next.delete(taskId)
            } else {
                next.add(taskId)
            }
            return next
        })
    }

    const toggleStep = (stepId: string) => {
        setExpandedSteps((prev) => {
            const next = new Set(prev)
            if (next.has(stepId)) {
                next.delete(stepId)
            } else {
                next.add(stepId)
            }
            return next
        })
    }

    const openRetryModal = (
        stepExecution: StepExecution,
        triggerEl: HTMLElement | null
    ) => {
        retryTriggerRef.current = triggerEl
        setRetryError(null)
        setRetryIdempotencyKey(
            typeof crypto !== 'undefined' && 'randomUUID' in crypto
                ? crypto.randomUUID()
                : `retry-${Date.now()}-${Math.random().toString(36).slice(2)}`
        )
        setRetryTarget(stepExecution)
    }

    const closeRetryModal = () => {
        setRetryTarget(null)
        setRetryError(null)
        setRetryIdempotencyKey(null)
        retryTriggerRef.current?.querySelector('button')?.focus()
    }

    const confirmRetry = async () => {
        if (!retryTarget || !retryIdempotencyKey) {
            return
        }
        setRetryError(null)
        try {
            await retryMutation.mutateAsync({
                stepExecutionId: retryTarget.id,
                idempotencyKey: retryIdempotencyKey,
            })
            show({
                text: i18n.t('Step retry started'),
                success: true,
            })
            closeRetryModal()
        } catch (err) {
            setRetryError(mapRetryStepError(err))
        }
    }

    if (!idReady) {
        return (
            <div className={shellClasses.pageRoot}>
                <NoticeBox error title={i18n.t('Invalid execution')}>
                    {i18n.t('The execution link is not a valid identifier.')}
                </NoticeBox>
                <Button onClick={() => navigate('/executions')}>
                    {i18n.t('Back to executions')}
                </Button>
            </div>
        )
    }

    if (isLoading && !execution) {
        return (
            <div className={shellClasses.pageRoot}>
                <PageLoader />
            </div>
        )
    }

    if (isError && error instanceof CapsApiError) {
        return (
            <div className={shellClasses.pageRoot}>
                <NoticeBox error title={i18n.t('Could not load execution')}>
                    {error.message}
                </NoticeBox>
                <Button onClick={() => navigate('/executions')}>
                    {i18n.t('Back to executions')}
                </Button>
            </div>
        )
    }

    if (!execution) {
        return null
    }

    const stepExecutions = execution.stepExecutions ?? []
    const logs = execution.logs ?? []
    const hasRetryableStep = stepExecutions.some((se) => se.retryable)

    const canPause = ['PENDING', 'RUNNING'].includes(execution.status)
    const canResume = execution.status === 'PAUSED'
    const canCancel = !['COMPLETED', 'FAILED', 'CANCELLED'].includes(
        execution.status
    )
    const isTerminal = ['COMPLETED', 'FAILED', 'CANCELLED'].includes(
        execution.status
    )

    return (
        <div className={shellClasses.pageRoot}>
            <ExecutionSummaryHeader
                execution={execution}
                canPause={canPause}
                canResume={canResume}
                canCancel={canCancel}
                isTerminal={isTerminal}
                hasRetryableStep={hasRetryableStep}
                isPausing={isPausing}
                isResuming={isResuming}
                onNavigateBack={() => navigate('/executions')}
                onPause={() => void pause()}
                onResume={() => void resume()}
                onCancel={() => setShowCancelConfirm(true)}
            />

            <div aria-live="polite" className={classes.liveRegion}>
                {retryMutation.isSuccess ? i18n.t('Step retry accepted') : null}
            </div>

            <details className={classes.contextSection}>
                <summary className={classes.contextSummary}>
                    {i18n.t('Context')}
                </summary>
                <pre className={classes.contextPre}>
                    {JSON.stringify(execution.context, null, 2)}
                </pre>
            </details>

            <ExecutionStepsSection
                stepExecutions={stepExecutions}
                idPrefix={uid}
                expandedSteps={expandedSteps}
                expandedTasks={expandedTasks}
                onToggleStep={toggleStep}
                onToggleTask={toggleTask}
                onViewTaskError={setTaskError}
                onRetryClick={openRetryModal}
            />

            <ExecutionLogsSection logs={logs} />

            {taskError && (
                <TaskErrorModal
                    task={taskError}
                    onClose={() => setTaskError(null)}
                />
            )}

            <RetryStepModal
                open={Boolean(retryTarget)}
                stepName={String(
                    retryTarget?.step?.name ?? retryTarget?.stepId ?? ''
                )}
                attemptNumber={retryTarget?.attemptNumber ?? 1}
                isPending={retryMutation.isPending}
                errorMessage={retryError}
                onClose={closeRetryModal}
                onConfirm={() => {
                    void confirmRetry()
                }}
            />

            {showCancelConfirm && (
                <CancelExecutionModal
                    isPending={isCancelling}
                    onClose={() => setShowCancelConfirm(false)}
                    onConfirm={async () => {
                        await cancel()
                        setShowCancelConfirm(false)
                    }}
                />
            )}
        </div>
    )
}

export default ExecutionDetailPage
