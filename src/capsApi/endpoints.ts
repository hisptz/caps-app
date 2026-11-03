import {
    type CapsDataEngine,
    capsDeleteJson,
    capsFetchJson,
    capsPostJson,
    capsPutJson,
} from '@/capsApi/client'
import {
    ActiveClimateJobsResponse,
    ClimateAsyncJobAcceptedResponse,
    ClimateDataSource,
    ClimateIngestionResponse,
    ClimateJobRecord,
    ClimateSyncDetail,
    ClimateSyncResponse,
    StacCollection,
    StacCollectionListResponse,
    CreateClimateIngestionRequest,
    CreatePipelineBody,
    CreateStepBody,
    DeadLettersResponse,
    DurationsResponse,
    ExecutionDetailResponse,
    ListExecutionsResponse,
    GetPredictionSetupResponse,
    ListEvaluationsResponse,
    ListHandlersResponse,
    ListPipelinesResponse,
    PipelineDetailResponse,
    SystemInfoResponse,
    TopErrorsResponse,
    TopFailingStepsResponse,
    TrendsResponse,
    UpdatePipelineBody,
    SyncClimateDatasetRequest,
    UpdateStepBody,
    RetryStepExecutionBody,
    RetryStepExecutionResponse,
    SourceRouteTestResponse,
    InstanceDetail,
    InstanceSummary,
    PutInstanceBody,
    MappingWithInstance,
} from '@/capsApi/types'
import type {
    CreateConnectorBody,
    CreateScheduleBody,
    CreateMergeBody,
    CreateWorkflowBody,
    DuplicatePipelineBody,
    ListWorkflowRunsResponse,
    StartWorkflowResponse,
    RunWorkflowBody,
    CreateWorkflowFromTemplateBody,
    CreateWorkflowFromTemplateResponse,
    UpdateWorkflowTemplateSetupBody,
    UpdateMergeBody,
    UpdateWorkflowBody,
    ListConnectorRunsResponse,
    UpdateConnectorBody,
    UpdateScheduleBody,
} from '@/capsApi/types'
import type {
    ConnectorRunStatus,
    PipelineConnector,
    DashboardData,
    Pipeline,
    PipelineExecutionStatus,
    PipelineSchedule,
    PipelineMerge,
    PipelineStep,
    Workflow,
    WorkflowDetail,
    WorkflowListItem,
    WorkflowRunDetail,
    WorkflowTemplate,
    WorkflowTemplateSetup,
    TemplatePreview,
    ClimatePredictionParams,
} from '@/shared/types/caps'

export function listPipelines(
    engine: CapsDataEngine,
    params?: {
        isActive?: boolean
        page?: number
        pageSize?: number
    }
) {
    return capsFetchJson<ListPipelinesResponse>(engine, '/pipelines', {
        searchParams: {
            ...(params?.isActive !== undefined
                ? { isActive: params.isActive ? 'true' : 'false' }
                : {}),
            page: params?.page,
            pageSize: params?.pageSize,
        },
    })
}

export function getPipeline(engine: CapsDataEngine, id: string) {
    return capsFetchJson<PipelineDetailResponse>(engine, `/pipelines/${id}`)
}

export function listExecutions(
    engine: CapsDataEngine,
    params?: {
        pipelineId?: string
        status?: PipelineExecutionStatus
        page?: number
        pageSize?: number
    }
) {
    return capsFetchJson<ListExecutionsResponse>(
        engine,
        '/monitoring/execution',
        {
            searchParams: {
                pipelineId: params?.pipelineId,
                status: params?.status,
                page: params?.page,
                pageSize: params?.pageSize,
            },
        }
    )
}

export function getExecution(engine: CapsDataEngine, id: string) {
    return capsFetchJson<ExecutionDetailResponse>(
        engine,
        `/monitoring/execution/${id}`
    )
}

export function getDashboard(engine: CapsDataEngine) {
    return capsFetchJson<DashboardData>(engine, '/monitoring/dashboard')
}

export function listDeadLetters(
    engine: CapsDataEngine,
    params?: {
        pipelineId?: string
        page?: number
        pageSize?: number
    }
) {
    return capsFetchJson<DeadLettersResponse>(
        engine,
        '/monitoring/dead-letters',
        {
            searchParams: {
                pipelineId: params?.pipelineId,
                page: params?.page,
                pageSize: params?.pageSize,
            },
        }
    )
}

export function getAnalyticsTrends(
    engine: CapsDataEngine,
    params?: {
        days?: number
        pipelineId?: string
    }
) {
    return capsFetchJson<TrendsResponse>(
        engine,
        '/monitoring/analytics/trends',
        {
            searchParams: {
                days: params?.days,
                pipelineId: params?.pipelineId,
            },
        }
    )
}

export function getTopErrors(
    engine: CapsDataEngine,
    params?: { days?: number; limit?: number }
) {
    return capsFetchJson<TopErrorsResponse>(
        engine,
        '/monitoring/analytics/top-errors',
        {
            searchParams: {
                days: params?.days,
                limit: params?.limit,
            },
        }
    )
}

export function getTopFailingSteps(
    engine: CapsDataEngine,
    params?: { days?: number; limit?: number }
) {
    return capsFetchJson<TopFailingStepsResponse>(
        engine,
        '/monitoring/analytics/top-failing-steps',
        {
            searchParams: {
                days: params?.days,
                limit: params?.limit,
            },
        }
    )
}

export function getPipelineDurations(
    engine: CapsDataEngine,
    params?: { days?: number }
) {
    return capsFetchJson<DurationsResponse>(
        engine,
        '/monitoring/analytics/durations',
        {
            searchParams: {
                days: params?.days,
            },
        }
    )
}

export function getSystemInfo(engine: CapsDataEngine) {
    return capsFetchJson<SystemInfoResponse>(engine, '/system/info')
}

export function cancelExecution(engine: CapsDataEngine, id: string) {
    return capsPostJson<{ executionId: string; status: string }>(
        engine,
        `/monitoring/executions/${id}/cancel`
    )
}

export function pauseExecution(engine: CapsDataEngine, id: string) {
    return capsPostJson<{ executionId: string; status: string }>(
        engine,
        `/monitoring/executions/${id}/pause`
    )
}

export function resumeExecution(engine: CapsDataEngine, id: string) {
    return capsPostJson<{ executionId: string; status: string }>(
        engine,
        `/monitoring/executions/${id}/resume`
    )
}

export function retryStepExecution(
    engine: CapsDataEngine,
    stepExecutionId: string,
    body: RetryStepExecutionBody
) {
    return capsPostJson<RetryStepExecutionResponse>(
        engine,
        `/monitoring/step-executions/${stepExecutionId}/retry`,
        { body }
    )
}

export function createPipeline(
    engine: CapsDataEngine,
    body: CreatePipelineBody
) {
    return capsPostJson<Pipeline>(engine, '/pipelines', { body })
}

export function updatePipeline(
    engine: CapsDataEngine,
    id: string,
    body: UpdatePipelineBody
) {
    return capsPutJson<Pipeline>(engine, `/pipelines/${id}`, { body })
}

export function deletePipeline(engine: CapsDataEngine, id: string) {
    return capsDeleteJson<void>(engine, `/pipelines/${id}`)
}

/** Copies the pipeline and its steps; not its schedules, connectors or workflow. */
export function duplicatePipeline(
    engine: CapsDataEngine,
    id: string,
    body: DuplicatePipelineBody
) {
    return capsPostJson<PipelineDetailResponse>(
        engine,
        `/pipelines/${id}/duplicate`,
        { body }
    )
}

export function listWorkflows(engine: CapsDataEngine) {
    return capsFetchJson<WorkflowListItem[]>(engine, '/workflows')
}

export function getWorkflow(engine: CapsDataEngine, id: string) {
    return capsFetchJson<WorkflowDetail>(engine, `/workflows/${id}`)
}

export function createWorkflow(
    engine: CapsDataEngine,
    body: CreateWorkflowBody
) {
    return capsPostJson<Workflow>(engine, '/workflows', { body })
}

export function updateWorkflow(
    engine: CapsDataEngine,
    id: string,
    body: UpdateWorkflowBody
) {
    return capsPutJson<Workflow>(engine, `/workflows/${id}`, { body })
}

export function deleteWorkflow(engine: CapsDataEngine, id: string) {
    return capsDeleteJson<Workflow>(engine, `/workflows/${id}`)
}

export function addWorkflowPipeline(
    engine: CapsDataEngine,
    id: string,
    pipelineId: string
) {
    return capsPutJson<WorkflowDetail>(
        engine,
        `/workflows/${id}/pipelines/${pipelineId}`
    )
}

export function removeWorkflowPipeline(
    engine: CapsDataEngine,
    id: string,
    pipelineId: string
) {
    return capsDeleteJson<WorkflowDetail>(
        engine,
        `/workflows/${id}/pipelines/${pipelineId}`
    )
}

export function runWorkflow(
    engine: CapsDataEngine,
    id: string,
    body?: RunWorkflowBody
) {
    return capsPostJson<StartWorkflowResponse>(
        engine,
        `/workflows/${id}/run`,
        body ? { body } : undefined
    )
}

export function listWorkflowTemplates(engine: CapsDataEngine) {
    return capsFetchJson<WorkflowTemplate[]>(engine, '/templates')
}

/** Checks the parameters and shows what they would create; saves nothing. */
export function previewWorkflowTemplate(
    engine: CapsDataEngine,
    template: string,
    params: ClimatePredictionParams
) {
    return capsPostJson<TemplatePreview>(
        engine,
        `/templates/${template}/preview`,
        { body: { params } }
    )
}

export function createWorkflowFromTemplate(
    engine: CapsDataEngine,
    template: string,
    body: CreateWorkflowFromTemplateBody
) {
    return capsPostJson<CreateWorkflowFromTemplateResponse>(
        engine,
        `/templates/${template}/workflows`,
        { body }
    )
}

export function getWorkflowTemplateSetup(engine: CapsDataEngine, id: string) {
    return capsFetchJson<WorkflowTemplateSetup>(
        engine,
        `/workflows/${id}/template`
    )
}

export function updateWorkflowTemplateSetup(
    engine: CapsDataEngine,
    id: string,
    body: UpdateWorkflowTemplateSetupBody
) {
    return capsPutJson<WorkflowDetail>(engine, `/workflows/${id}/template`, {
        body,
    })
}

export function listWorkflowRuns(
    engine: CapsDataEngine,
    id: string,
    params?: { page?: number; pageSize?: number }
) {
    return capsFetchJson<ListWorkflowRunsResponse>(
        engine,
        `/workflows/${id}/runs`,
        { searchParams: { page: params?.page, pageSize: params?.pageSize } }
    )
}

/** Merges that wait for this pipeline or start it */
export function listPipelineMerges(engine: CapsDataEngine, pipelineId: string) {
    return capsFetchJson<PipelineMerge[]>(engine, '/merges', {
        searchParams: { pipelineId },
    })
}

export function createMerge(engine: CapsDataEngine, body: CreateMergeBody) {
    return capsPostJson<PipelineMerge>(engine, '/merges', { body })
}

export function updateMerge(
    engine: CapsDataEngine,
    id: string,
    body: UpdateMergeBody
) {
    return capsPutJson<PipelineMerge>(engine, `/merges/${id}`, { body })
}

export function deleteMerge(engine: CapsDataEngine, id: string) {
    return capsDeleteJson<PipelineMerge>(engine, `/merges/${id}`)
}

export function getWorkflowRun(engine: CapsDataEngine, runId: string) {
    return capsFetchJson<WorkflowRunDetail>(engine, `/workflows/runs/${runId}`)
}

export function createStep(
    engine: CapsDataEngine,
    pipelineId: string,
    body: CreateStepBody
) {
    return capsPostJson<PipelineStep>(
        engine,
        `/pipelines/${pipelineId}/steps`,
        { body }
    )
}

export function updateStep(
    engine: CapsDataEngine,
    ids: { pipelineId: string; stepId: string },
    body: UpdateStepBody
) {
    return capsPutJson<PipelineStep>(
        engine,
        `/pipelines/${ids.pipelineId}/steps/${ids.stepId}`,
        { body }
    )
}

export function deleteStep(
    engine: CapsDataEngine,
    pipelineId: string,
    stepId: string
) {
    return capsDeleteJson<void>(
        engine,
        `/pipelines/${pipelineId}/steps/${stepId}`
    )
}

export function createPipelineSchedule(
    engine: CapsDataEngine,
    pipelineId: string,
    body: CreateScheduleBody
) {
    return capsPostJson<PipelineSchedule>(
        engine,
        `/pipelines/${pipelineId}/schedules`,
        { body }
    )
}

export function pauseSchedule(engine: CapsDataEngine, scheduleId: string) {
    return capsPostJson<PipelineSchedule>(
        engine,
        `/schedules/${scheduleId}/pause`
    )
}

export function resumeSchedule(engine: CapsDataEngine, scheduleId: string) {
    return capsPostJson<PipelineSchedule>(
        engine,
        `/schedules/${scheduleId}/resume`
    )
}

export function updateSchedule(
    engine: CapsDataEngine,
    scheduleId: string,
    body: UpdateScheduleBody
) {
    return capsPutJson<PipelineSchedule>(engine, `/schedules/${scheduleId}`, {
        body,
    })
}

export function deleteSchedule(engine: CapsDataEngine, scheduleId: string) {
    return capsDeleteJson<PipelineSchedule>(engine, `/schedules/${scheduleId}`)
}

export function listPipelineConnectors(
    engine: CapsDataEngine,
    pipelineId: string
) {
    return capsFetchJson<PipelineConnector[]>(engine, '/connectors', {
        searchParams: { pipelineId },
    })
}

export function createConnector(
    engine: CapsDataEngine,
    body: CreateConnectorBody
) {
    return capsPostJson<PipelineConnector>(engine, '/connectors', { body })
}

export function updateConnector(
    engine: CapsDataEngine,
    connectorId: string,
    body: UpdateConnectorBody
) {
    return capsPutJson<PipelineConnector>(
        engine,
        `/connectors/${connectorId}`,
        { body }
    )
}

export function deleteConnector(engine: CapsDataEngine, connectorId: string) {
    return capsDeleteJson<PipelineConnector>(
        engine,
        `/connectors/${connectorId}`
    )
}

export function listConnectorRuns(
    engine: CapsDataEngine,
    connectorId: string,
    params?: { status?: ConnectorRunStatus; page?: number; pageSize?: number }
) {
    return capsFetchJson<ListConnectorRunsResponse>(
        engine,
        `/connectors/${connectorId}/runs`,
        {
            searchParams: {
                status: params?.status,
                page: params?.page,
                pageSize: params?.pageSize,
            },
        }
    )
}

export function cancelConnectorRun(
    engine: CapsDataEngine,
    connectorRunId: string
) {
    return capsPostJson<{ connectorRunId: string; status: ConnectorRunStatus }>(
        engine,
        `/connectors/runs/${connectorRunId}/cancel`
    )
}

export function listHandlers(engine: CapsDataEngine) {
    return capsFetchJson<ListHandlersResponse>(engine, '/handlers')
}

export function testSourceRoute(engine: CapsDataEngine, routeCode: string) {
    return capsFetchJson<SourceRouteTestResponse>(
        engine,
        `/source-routes/${routeCode}/test`
    )
}

export function listInstances(engine: CapsDataEngine) {
    return capsFetchJson<InstanceSummary[]>(engine, '/instances')
}

export function getInstance(engine: CapsDataEngine, routeCode: string) {
    return capsFetchJson<InstanceDetail>(engine, `/instances/${routeCode}`)
}

export function putInstance(
    engine: CapsDataEngine,
    routeCode: string,
    body: PutInstanceBody
) {
    return capsPutJson<InstanceDetail>(engine, `/instances/${routeCode}`, {
        body,
    })
}

export function deleteInstance(engine: CapsDataEngine, routeCode: string) {
    return capsDeleteJson<{ routeCode: string; removedMappings: number }>(
        engine,
        `/instances/${routeCode}`
    )
}

export function listAllMappings(engine: CapsDataEngine) {
    return capsFetchJson<MappingWithInstance[]>(engine, '/mappings')
}

export function listEvaluations(engine: CapsDataEngine) {
    return capsFetchJson<ListEvaluationsResponse>(engine, '/evaluations')
}

export function getPredictionSetup(engine: CapsDataEngine, id: number) {
    return capsFetchJson<GetPredictionSetupResponse>(
        engine,
        `/prediction-setups/${id}`
    )
}

export function listClimateCollections(engine: CapsDataEngine) {
    return capsFetchJson<StacCollectionListResponse>(
        engine,
        '/climate/collections'
    )
}

export function getClimateCollection(engine: CapsDataEngine, id: string) {
    return capsFetchJson<StacCollection>(
        engine,
        `/climate/collections/${encodeURIComponent(id)}`
    )
}

export function listClimateDataSources(engine: CapsDataEngine) {
    return capsFetchJson<ClimateDataSource[]>(engine, '/climate/data-sources')
}

export function createClimateIngestion(
    engine: CapsDataEngine,
    body: CreateClimateIngestionRequest
) {
    return capsPostJson<
        ClimateAsyncJobAcceptedResponse | ClimateIngestionResponse
    >(engine, '/climate/ingestions', {
        body,
        searchParams: { async: true },
    })
}

export function syncClimateDataset(
    engine: CapsDataEngine,
    datasetId: string,
    body: SyncClimateDatasetRequest = {}
) {
    return capsPostJson<ClimateAsyncJobAcceptedResponse | ClimateSyncResponse>(
        engine,
        `/climate/sync/${datasetId}`,
        { body, searchParams: { async: true } }
    )
}

export function getClimateSyncPlan(engine: CapsDataEngine, datasetId: string) {
    return capsFetchJson<ClimateSyncDetail>(
        engine,
        `/climate/sync/${datasetId}/plan`
    )
}

export function listActiveClimateJobs(engine: CapsDataEngine) {
    return capsFetchJson<ActiveClimateJobsResponse>(
        engine,
        '/climate/ingestions/jobs'
    )
}

export function getClimateIngestionJob(engine: CapsDataEngine, jobId: string) {
    return capsFetchJson<ClimateJobRecord>(
        engine,
        `/climate/ingestions/jobs/${jobId}`
    )
}

export function cancelClimateIngestionJob(
    engine: CapsDataEngine,
    jobId: string
) {
    return capsDeleteJson<ClimateJobRecord>(
        engine,
        `/climate/ingestions/jobs/${jobId}`
    )
}
