import type {
    AnalyticsTrend,
    Evaluation,
    PredictionSetup,
    ExecutionLog,
    Pipeline,
    PipelineDuration,
    PipelineExecution,
    PipelineSchedule,
    PipelineStep,
    TopError,
    TopFailingStep,
} from '@/shared/types/caps'

/** Pagination object returned by CAPS list endpoints */
export interface CapsPagination {
    page: number
    pageSize: number
    total: number
    pages: number
}

export interface ListPipelinesResponse {
    pipelines: Pipeline[]
    pagination: CapsPagination
}

export interface PipelineDetailResponse extends Pipeline {
    config?: Record<string, unknown>
    steps: PipelineStep[]
    schedules: PipelineSchedule[]
}

/** List row shape: pipeline may only include `name` */
export interface ExecutionListRow {
    id: string
    pipelineId: string
    scheduleId: string | null
    status: PipelineExecution['status']
    context: Record<string, unknown>
    currentStepIndex: number
    triggeredBy: string | null
    startedAt: string | null
    finishedAt: string | null
    createdAt: string
    updatedAt?: string
    pipeline?: PipelineExecution['pipeline']
}

export interface ListExecutionsResponse {
    executions: ExecutionListRow[]
    pagination: CapsPagination
}

/** Pipeline-detail executions tab row (same shape as the monitoring list). */
export type PipelineExecutionSummary = ExecutionListRow

export type ExecutionDetailResponse = PipelineExecution & {
    logs: ExecutionLog[]
}

/** POST /monitoring/step-executions/:id/retry */
export interface RetryStepExecutionBody {
    idempotencyKey: string
}

export interface RetryStepExecutionResponse {
    executionId: string
    sourceStepExecutionId: string
    replacementStepExecutionId: string
    retryCommandId: string
    status: 'ACCEPTED'
    reused: boolean
}

export interface DeadLettersResponse {
    logs: ExecutionLog[]
    pagination: CapsPagination
}

export type TrendsResponse = AnalyticsTrend[]
export type TopErrorsResponse = TopError[]
export type TopFailingStepsResponse = TopFailingStep[]
export type DurationsResponse = PipelineDuration[]

/** POST /monitoring/pipelines/:id/trigger success body */
export interface TriggerPipelineResponse {
    executionId: string
    skipped: boolean
    skipReason?: string
}

/** Subset of CHAP fields from GET /system/info (caps.chap.info) */
export type ChapSystemInfo = {
    chap_core_version?: string
    python_version?: string
    revision?: string
    server_date?: string
    server_time_zone_id?: string
    auth_required?: boolean
}

export type ClimateApiInfo = {
    app_version: string
    python_version: string
    uvicorn_version: string
    read_only?: boolean
}

/** Subset of DHIS2 system info — excludes DB URLs, JVM args, etc. */
export interface DhisSystemInfoSummary {
    version?: string
    contextPath?: string
    systemName?: string
    serverDate?: string
    revision?: string
}

export interface ConnectedSystemBlock<T> {
    connected: boolean
    info?: T | null
}

export interface CapsSystemInfoPayload {
    version: string
    chap: ConnectedSystemBlock<ChapSystemInfo>
    dhis: ConnectedSystemBlock<DhisSystemInfoSummary>
    climateApi: ConnectedSystemBlock<ClimateApiInfo>
}

/** GET /system/info */
export interface SystemInfoResponse {
    success: boolean
    caps: CapsSystemInfoPayload
}

export interface SourceRouteTestResponse {
    routeCode: string
    reachable: boolean
    user?: { username: string | null; displayName: string | null }
    system?: {
        systemName: string | null
        version: string | null
        revision: string | null
        contextPath: string | null
        serverDate: string | null
        analyticsUpTo: string | null
    }
    error?: string
    code?: string
}

export interface CreatePipelineBody {
    name: string
    description?: string
    isActive: boolean
    concurrencyPolicy: 'ALLOW' | 'SKIP' | 'REPLACE'
    config?: Record<string, unknown>
}

export type UpdatePipelineBody = Partial<CreatePipelineBody>

export interface CreateStepBody {
    name: string
    description?: string
    handlerKey: string
    stepOrder: number
    maxRetries?: number
    retryDelayMs?: number
    handlerConfig?: Record<string, unknown>
    inputSchema?: Record<string, unknown>
}

export type UpdateStepBody = Partial<CreateStepBody>

export interface CreateScheduleBody {
    name: string
    description?: string
    cronExpr: string
    inputContext?: Record<string, unknown>
}

export interface UpdateScheduleBody {
    name?: string
    description?: string | null
    cronExpr?: string
    inputContext?: Record<string, unknown>
}

/** JSON Schema object from GET /handlers (draft-2020-12). */
export type HandlerJsonSchema = Record<string, unknown>

export type HandlerDescriptor = {
    key: string
    displayName: string
    description: string
    tags: string[]
    queueName: string
    schemas?: {
        config?: HandlerJsonSchema
        context?: HandlerJsonSchema
    }
}

export type ListHandlersResponse = {
    handlers: HandlerDescriptor[]
}

export interface ListEvaluationsResponse {
    evaluations: Evaluation[]
    error?: string
    code?: string
}

/** `setup` is null when the evaluation has no prediction setup in CHAP yet. */
export interface GetPredictionSetupResponse {
    setup: PredictionSetup | null
    error?: string
    code?: string
}

export function paginationToPageCount(p: CapsPagination): number {
    return Math.max(1, p.pages)
}

export type ClimateTemporalExtent = {
    start?: string | null
    end?: string | null
}

/** The subset of a STAC 1.1 collection (with the datacube and CF extensions) CAPS reads. */
export type StacCollection = {
    type: 'Collection'
    id: string
    title?: string
    description?: string
    license?: string
    keywords?: string[]
    extent?: {
        spatial?: { bbox?: number[][] }
        temporal?: { interval?: Array<[string | null, string | null]> }
    }
    'cube:dimensions'?: Record<
        string,
        { type: string; extent?: unknown[]; step?: string | number | null }
    >
    'cube:variables'?: Record<
        string,
        {
            type?: string
            unit?: string
            description?: string
            'cf:standard_name'?: string
        }
    >
    providers?: Array<{ name: string; url?: string }>
    assets?: Record<
        string,
        { href: string; type?: string; title?: string; roles?: string[] }
    >
    renders?: Record<string, { 'open_climate_service:variable'?: string }>
    links?: Array<{ rel: string; href: string; type?: string; title?: string }>
}

export type StacCollectionListResponse = {
    collections: StacCollection[]
}

/** A published climate collection, flattened from STAC for display and pipeline config. */
export type ClimateCollection = {
    id: string
    title: string
    description?: string
    variable?: string
    units?: string
    variables: Array<{ name: string; unit?: string; standardName?: string }>
    /** Derived from the temporal step: daily, weekly, monthly…, or irregular (e.g. dekadal). */
    periodType?: string
    extent: { temporal: ClimateTemporalExtent; bbox?: number[] }
    providers: Array<{ name: string; url?: string }>
    license?: string
    assets: Array<{ key: string; href: string; title?: string; type?: string }>
}

export type ClimateTemplateSpatialExtent = {
    bbox: [number, number, number, number]
}

export type ClimateTemplateTemporalExtent = {
    begin: string
    end: string
    resolution?: string
}

export type ClimateTemplateExtents = {
    spatial: ClimateTemplateSpatialExtent
    temporal: ClimateTemplateTemporalExtent
}

export type ClimateTemplateSync = {
    kind: string
}

export type ClimateTemplateIngestion = {
    plugin: string
    params: Record<string, unknown>
}

export type ClimateDataSource = {
    id: string
    name: string
    short_name?: string | null
    variable: string
    period_type: string
    temporal_direction?: string
    sync?: ClimateTemplateSync
    extents?: ClimateTemplateExtents
    ingestion?: ClimateTemplateIngestion
}

export type CreateClimateIngestionRequest = {
    dataset_id: string
    start?: string | null
    end?: string | null
    overwrite?: boolean
    publish?: boolean
}

export type ClimateIngestionResponse = {
    ingestion_id: string
    status: string
}

export type ClimateAsyncJobAcceptedResponse = {
    jobId: string
    status: 'accepted'
    ingestion_id?: string
}

export type ClimateJobStatus =
    | 'accepted'
    | 'running'
    | 'retrying'
    | 'successful'
    | 'failed'
    | 'cancelled'

export type ClimateJobRecord = {
    jobID: string
    processID: string
    type: string
    status: ClimateJobStatus
    createdAt: string
    startedAt?: string | null
    finishedAt?: string | null
    progress?: {
        done?: number | null
        total?: number | null
        percent?: number | null
        message?: string | null
    }
    error?: { type: string; message: string } | null
    cancelRequested: boolean
    links?: Array<{ href: string; rel: string; title?: string }>
}

export type SyncClimateDatasetRequest = {
    end?: string | null
    publish?: boolean
}

export type ClimateSyncDetail = {
    source_dataset_id: string
    sync_kind: string
    action: string
    reason: string
    message: string
    current_start?: string | null
    current_end?: string | null
    target_end?: string | null
    target_end_source: string
    delta_start?: string | null
    delta_end?: string | null
}

export type ClimateSyncResponse = {
    sync_id?: string | null
    status: string
    message?: string | null
    sync_detail?: ClimateSyncDetail | null
}
