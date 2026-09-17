export interface ConfiguredModel {
    id: string
    name: string
    displayName: string
    covariates: Array<{
        name: string
        displayName: string
    }>
    target?: {
        name: string
        displayName: string
    }
    supportedPeriodType: 'month' | 'week'
}

export type ConcurrencyPolicy = 'ALLOW' | 'SKIP' | 'REPLACE'
export type ScheduleStatus = 'ACTIVE' | 'PAUSED'
export type PipelineExecutionStatus =
    | 'PENDING'
    | 'RUNNING'
    | 'AWAITING_STEP'
    | 'COMPLETED'
    | 'FAILED'
    | 'CANCELLED'
    | 'PAUSED'
export type StepExecutionStatus =
    | 'PENDING'
    | 'RUNNING'
    | 'SUCCEEDED'
    | 'FAILED'
    | 'TIMED_OUT'
    | 'SKIPPED'
export type TaskExecutionStatus = 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED'
export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'

/** Pipeline row embedded in execution responses (may be name-only from list APIs). */
export type EmbeddedPipeline = { name: string } & Partial<Pipeline>

export interface Pipeline {
    id: string
    name: string
    description: string | null
    isActive: boolean
    concurrencyPolicy: ConcurrencyPolicy
    createdAt: string
    updatedAt: string
    _count: {
        steps: number
        executions: number
        schedules: number
    }
}

export interface PipelineStep {
    id: string
    pipelineId: string
    name: string
    description: string | null
    handlerKey: string
    stepOrder: number
    maxRetries: number
    retryDelayMs: number
    inputSchema: unknown | null
    handlerConfig: Record<string, unknown> | null
}

export interface PipelineSchedule {
    id: string
    pipelineId: string
    name: string
    description: string | null
    status: ScheduleStatus
    cronExpr: string
    inputContext: Record<string, unknown> | null
    lastRunAt: string | null
    nextRunAt: string | null
    createdAt: string
}

export interface PipelineExecution {
    id: string
    pipelineId: string
    scheduleId: string | null
    status: PipelineExecutionStatus
    context: Record<string, unknown>
    currentStepIndex: number
    triggeredBy: string | null
    startedAt: string | null
    finishedAt: string | null
    createdAt: string
    pipeline?: EmbeddedPipeline
    stepExecutions?: StepExecution[]
}

export type StepAttemptKind = 'AUTOMATIC' | 'MANUAL'

export type RetryBlockedReason =
    | 'EXECUTION_NOT_FAILED'
    | 'ATTEMPT_NOT_FAILED'
    | 'NOT_CURRENT_STEP'
    | 'NOT_LATEST_ATTEMPT'
    | 'MISSING_STEP_SNAPSHOT'
    | 'ACTIVE_ATTEMPT_EXISTS'
    | 'NOT_RETRYABLE'
    | 'RETRY_IN_PROGRESS'
    | 'IDEMPOTENCY_KEY_CONFLICT'

export interface StepExecution {
    id: string
    executionId: string
    stepId: string
    status: StepExecutionStatus
    attemptNumber: number
    attemptKind?: StepAttemptKind
    stepSnapshot?: Record<string, unknown> | null
    input: Record<string, unknown> | null
    output: Record<string, unknown> | null
    errorMessage: string | null
    errorStack: string | null
    startedAt: string | null
    finishedAt: string | null
    /** Authoritative eligibility from GET /monitoring/execution/:id */
    retryable?: boolean
    retryBlockedReason?: RetryBlockedReason | null
    step?: PipelineStep
    taskExecutions?: TaskExecution[]
    logs?: ExecutionLog[]
}

export interface TaskExecution {
    id: string
    stepExecutionId: string
    name: string
    taskOrder: number
    status: TaskExecutionStatus
    input: Record<string, unknown> | null
    output: Record<string, unknown> | null
    errorMessage: string | null
    errorStack: string | null
    startedAt: string | null
    finishedAt: string | null
}

export interface ExecutionLog {
    id: string
    executionId: string
    stepExecutionId: string | null
    taskExecutionId: string | null
    level: LogLevel
    message: string
    metadata: Record<string, unknown> | null
    loggedAt: string
}

export interface DashboardData {
    last24h: {
        total: number
        completed: number
        failed: number
        running: number
        awaitingStep: number
    }
    stuckExecutions: PipelineExecution[]
    recentFailures: PipelineExecution[]
}

export interface AnalyticsTrend {
    date: string
    status: PipelineExecutionStatus
    count: number
}

export interface TopError {
    errorMessage: string
    occurrenceCount: number
}

export interface TopFailingStep {
    stepName: string
    pipelineName: string
    failureCount: number
    avgAttempts: number
}

export interface PipelineDuration {
    pipelineName: string
    avgDurationSeconds: number
    p95DurationSeconds: number
    runCount: number
}

export interface ApiPagination {
    page: number
    pageSize: number
    total: number
    pageCount: number
}
