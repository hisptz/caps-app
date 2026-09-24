import {
    type CapsDataEngine,
    capsDeleteJson,
    capsFetchJson,
    capsPostJson,
    capsPutJson,
} from '@/capsApi/client'
import {
    ClimateAsyncJobAcceptedResponse,
    ClimateDatasetDetailRecord,
    ClimateDatasetListResponse,
    ClimateDatasetTemplate,
    ClimateIngestionResponse,
    ClimateJobRecord,
    ClimateSyncDetail,
    ClimateSyncResponse,
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
} from '@/capsApi/types'
import type { CreateScheduleBody, UpdateScheduleBody } from '@/capsApi/types'
import type {
    DashboardData,
    Pipeline,
    PipelineExecutionStatus,
    PipelineSchedule,
    PipelineStep,
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

export function listHandlers(engine: CapsDataEngine) {
    return capsFetchJson<ListHandlersResponse>(engine, '/handlers')
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

export function listClimateDatasets(engine: CapsDataEngine) {
    return capsFetchJson<ClimateDatasetListResponse>(
        engine,
        '/climate/datasets'
    )
}

export function getClimateDataset(engine: CapsDataEngine, id: string) {
    return capsFetchJson<ClimateDatasetDetailRecord>(
        engine,
        `/climate/datasets/${id}`
    )
}

export function listClimateDatasetTemplates(engine: CapsDataEngine) {
    return capsFetchJson<ClimateDatasetTemplate[]>(
        engine,
        '/climate/dataset-templates/'
    )
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
