import type {
    AnalyticsTrend,
    ConfiguredModel,
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

export interface ListModelsResponse {
    models: ConfiguredModel[]
    error?: string
}

export function paginationToPageCount(p: CapsPagination): number {
    return Math.max(1, p.pages)
}

export type ClimateSpatialExtent = {
    xmin: number
    ymin: number
    xmax: number
    ymax: number
}

export type ClimateTemporalExtent = {
    start?: string | null
    end?: string | null
}

export type ClimateArtifactCoverage = {
    spatial: ClimateSpatialExtent
    spatial_wgs84?: ClimateSpatialExtent | null
    temporal: ClimateTemporalExtent
}

export type ClimatePublicationStatus = 'unpublished' | 'published'

export type ClimateDatasetPublication = {
    status: ClimatePublicationStatus
    published_at?: string | null
}

export type ClimateDatasetRecord = {
    dataset_id: string
    source_dataset_id: string
    dataset_name: string
    short_name?: string | null
    variable: string
    period_type: string
    units?: string | null
    resolution?: string | null
    source?: string | null
    source_url?: string | null
    extent: ClimateArtifactCoverage
    last_updated: string
    links?: Array<{ href: string; rel: string; title: string }>
    publication: ClimateDatasetPublication
}

export type ClimateDatasetVersionRecord = {
    created_at: string
    format: 'zarr' | 'netcdf' | 'icechunk'
    coverage: ClimateArtifactCoverage
    request_scope?: {
        start?: string | null
        end?: string | null
        bbox?: [number, number, number, number] | null
    } | null
}

export type ClimateDatasetDetailRecord = ClimateDatasetRecord & {
    versions: ClimateDatasetVersionRecord[]
}

/** @deprecated Use ClimateDatasetDetailRecord — kept for handler config compatibility */
export type ClimateDataset = ClimateDatasetDetailRecord

export type ClimateDatasetListResponse = {
    kind?: string
    items?: ClimateDatasetRecord[]
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

export type ClimateDatasetTemplate = {
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
    dataset?: ClimateDatasetRecord | null
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
    dataset?: ClimateDatasetDetailRecord | null
    sync_detail?: ClimateSyncDetail | null
}
