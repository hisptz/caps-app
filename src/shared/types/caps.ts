/** A CHAP evaluation (backtest). `predictionSetupId` is null until one is created in CHAP. */
export interface Evaluation {
    id: number
    name: string
    modelId: string
    modelDisplayName: string
    datasetName: string
    periodType: string | null
    created: string | null
    predictionSetupId: number | null
}

export interface CovariateSource {
    covariate: string
    dataElementId: string
}

export interface QuantileTarget {
    quantile: string
    dataElementId: string
}
export interface PredictionSetup {
    id: number
    name: string
    created: string | null
    backtestId: number
    configuredModel: { id: number; name: string }
    startPeriod: string | null
    orgUnits: string[]
    covariateSources: CovariateSource[]
    periodType: string | null
    scheduleCronExpression: string | null
    scheduleEnabled: boolean
    quantileTargets: QuantileTarget[]
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
export type EmbeddedPipeline = { name: string } & Partial<Pipeline>

export interface Pipeline {
    id: string
    name: string
    description: string | null
    isActive: boolean
    concurrencyPolicy: ConcurrencyPolicy
    config?: Record<string, unknown> | null
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
    /** Connectors passed through to reach this execution (0 = started directly). */
    chainDepth?: number
    /** Detail only: the connector run that started this execution. */
    incomingConnectorRun?: IncomingConnectorRun | null
    /** Detail only: what this execution's connectors decided when it finished. */
    outgoingConnectorRuns?: OutgoingConnectorRun[]
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

/** Identical upstream conflicts collapsed into one row (see caps-engine `groupConflicts`). */
export interface ErrorConflict {
    value: string
    count: number
    /** First few objects (UIDs, row refs) that hit this conflict */
    objects: string[]
}

/** Structured failure context stored next to the short `errorMessage` headline. */
export interface ErrorDetails {
    source?: string
    httpStatus?: number
    request?: string
    description?: string
    conflicts?: ErrorConflict[]
    totalConflicts?: number
    /** Original message when `errorMessage` was truncated */
    fullMessage?: string
    [key: string]: unknown
}

/** The error columns shared by step and task executions. */
export type ExecutionError = Pick<
    StepExecution,
    'errorMessage' | 'errorStack' | 'errorDetails'
>

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
    errorDetails?: ErrorDetails | null
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
    errorDetails?: ErrorDetails | null
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
    /** Connector runs whose evaluation is more than 10 minutes late. */
    overdueConnectorRuns?: OverdueConnectorRun[]
}

/** Which source outcome makes a connector run. */
export type ConnectorTriggerOn = 'COMPLETED' | 'FAILED' | 'FINISHED'

export type ConnectorRunStatus =
    | 'WAITING'
    | 'FIRED'
    | 'NOT_MET'
    | 'SKIPPED'
    | 'FAILED'
    | 'CANCELLED'

export interface PipelineRef {
    id: string
    name: string
    isActive?: boolean
}

/**
 * Starts the target pipeline when the source pipeline finishes and the rule is met, or the
 * otherwise pipeline (if any) when it is not.
 * `condition` is JSONLogic over `{ context, status }` of the source execution.
 */
export interface PipelineConnector {
    id: string
    name: string
    description: string | null
    sourcePipelineId: string
    targetPipelineId: string
    /** Started instead of the target when the rule is not met; null = nothing. */
    otherwisePipelineId: string | null
    on: ConnectorTriggerOn
    condition: unknown
    /** Target context path -> dot path into the source execution's context. */
    inputMapping: Record<string, string>
    delayMinutes: number
    isActive: boolean
    createdAt: string
    updatedAt: string
    sourcePipeline?: PipelineRef
    targetPipeline?: PipelineRef
    otherwisePipeline?: PipelineRef | null
    _count?: { runs: number }
    /** The latest connector run only (newest first, at most one). */
    runs?: LatestConnectorRun[]
}

export type LatestConnectorRun = Pick<
    ConnectorRun,
    | 'id'
    | 'status'
    | 'startedOtherwise'
    | 'reason'
    | 'checkAt'
    | 'evaluatedAt'
    | 'createdAt'
> & {
    targetExecution: { id: string; status: PipelineExecutionStatus } | null
}

/** One decision a connector made for one finished source execution. */
export interface ConnectorRun {
    id: string
    connectorId: string
    sourceExecutionId: string
    targetExecutionId: string | null
    status: ConnectorRunStatus
    /** FIRED because the rule was not met: the otherwise pipeline was started. */
    startedOtherwise: boolean
    sourceStatus: PipelineExecutionStatus
    checkAt: string
    evaluatedAt: string | null
    reason: string | null
    createdAt: string
    updatedAt: string
}

export type IncomingConnectorRun = ConnectorRun & {
    connector: { id: string; name: string }
    sourceExecution: {
        id: string
        status: PipelineExecutionStatus
        pipeline: { id: string; name: string }
    }
}

export type OutgoingConnectorRun = ConnectorRun & {
    connector: {
        id: string
        name: string
        targetPipeline: { id: string; name: string }
        otherwisePipeline: { id: string; name: string } | null
    }
    targetExecution: { id: string; status: PipelineExecutionStatus } | null
}

export type OverdueConnectorRun = ConnectorRun & {
    connector: {
        id: string
        name: string
        sourcePipeline: { name: string }
        targetPipeline: { name: string }
        otherwisePipeline: { name: string } | null
    }
}

export type ConnectorRunListRow = ConnectorRun & {
    sourceExecution: {
        id: string
        status: PipelineExecutionStatus
        finishedAt: string | null
    }
    targetExecution: {
        id: string
        status: PipelineExecutionStatus
        createdAt: string
    } | null
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
