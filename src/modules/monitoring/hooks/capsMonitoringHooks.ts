import { useQuery } from '@tanstack/react-query'
import type { CapsDataEngine } from '@/capsApi/client'
import {
    getAnalyticsTrends,
    getDashboard,
    getExecution,
    getPipeline,
    getPipelineDurations,
    getSystemInfo,
    getTopErrors,
    getTopFailingSteps,
    listDeadLetters,
    listExecutions,
    listPipelines,
} from '@/capsApi/endpoints'
import { isUuid } from '@/capsApi/isUuid'
import { capsKeys } from '@/capsApi/queryKeys'
import type {
    ExecutionDetailResponse,
    SystemInfoResponse,
} from '@/capsApi/types'
import type { PipelineExecutionStatus } from '@/shared/types/caps'

export type SystemInfoQueryData = SystemInfoResponse & {
    /** Round-trip time for the last GET /system/info fetch (aggregate probe latency). */
    fetchLatencyMs: number
}

export function useDashboardQuery(engine: CapsDataEngine) {
    return useQuery({
        queryKey: capsKeys.dashboard(),
        queryFn: () => getDashboard(engine),
    })
}

export function useSystemInfoQuery(engine: CapsDataEngine) {
    return useQuery({
        queryKey: capsKeys.systemInfo(),
        queryFn: async (): Promise<SystemInfoQueryData> => {
            const start = performance.now()
            const result = await getSystemInfo(engine)
            return {
                ...result,
                fetchLatencyMs: Math.round(performance.now() - start),
            }
        },
    })
}

export function useAnalyticsQueries(engine: CapsDataEngine, days: number) {
    const trendsQuery = useQuery({
        queryKey: capsKeys.analytics.trends(days),
        queryFn: () => getAnalyticsTrends(engine, { days }),
    })
    const topStepsQuery = useQuery({
        queryKey: capsKeys.analytics.topFailingSteps(days),
        queryFn: () => getTopFailingSteps(engine, { days, limit: 10 }),
    })
    const durationsQuery = useQuery({
        queryKey: capsKeys.analytics.durations(days),
        queryFn: () => getPipelineDurations(engine, { days }),
    })
    const topErrorsQuery = useQuery({
        queryKey: capsKeys.analytics.topErrors(days),
        queryFn: () => getTopErrors(engine, { days, limit: 10 }),
    })
    return { trendsQuery, topStepsQuery, durationsQuery, topErrorsQuery }
}

export function useExecutionsPageQueries(
    engine: CapsDataEngine,
    filters: {
        pipelineId: string
        status: string
        page: number
        pageSize: number
    }
) {
    const { pipelineId, status, page, pageSize } = filters
    const pipelinesFilterQuery = useQuery({
        queryKey: capsKeys.pipelines.filterOptions(),
        queryFn: () => listPipelines(engine, { page: 1, pageSize: 100 }),
    })
    const executionsQuery = useQuery({
        queryKey: capsKeys.executions.list({
            pipelineId: pipelineId || undefined,
            status,
            page,
            pageSize,
        }),
        queryFn: () =>
            listExecutions(engine, {
                pipelineId: pipelineId || undefined,
                status: status
                    ? (status as PipelineExecutionStatus)
                    : undefined,
                page,
                pageSize,
            }),
    })
    return { pipelinesFilterQuery, executionsQuery }
}

export function useDeadLettersPageQueries(
    engine: CapsDataEngine,
    filters: { pipelineId: string; page: number; pageSize: number }
) {
    const { pipelineId, page, pageSize } = filters
    const pipelinesFilterQuery = useQuery({
        queryKey: capsKeys.pipelines.deadLetterFilters(),
        queryFn: () => listPipelines(engine, { page: 1, pageSize: 100 }),
    })
    const deadLettersQuery = useQuery({
        queryKey: capsKeys.deadLetters.list({ pipelineId, page, pageSize }),
        queryFn: () =>
            listDeadLetters(engine, {
                pipelineId: pipelineId || undefined,
                page,
                pageSize,
            }),
    })
    return { pipelinesFilterQuery, deadLettersQuery }
}

const EXECUTION_POLL_MS = 3000

const TERMINAL_EXECUTION_STATUSES: PipelineExecutionStatus[] = [
    'COMPLETED',
    'FAILED',
    'CANCELLED',
]

const isExecutionActive = (status: PipelineExecutionStatus) =>
    !TERMINAL_EXECUTION_STATUSES.includes(status)

export function useExecutionDetailQuery(
    engine: CapsDataEngine,
    id: string | undefined
) {
    const idReady = isUuid(id)
    return useQuery<ExecutionDetailResponse>({
        queryKey: capsKeys.execution.detail(id),
        queryFn: () => getExecution(engine, id!),
        enabled: idReady,
        refetchInterval: (data) => {
            if (!data) {
                return false
            }
            return isExecutionActive(data.status) ? EXECUTION_POLL_MS : false
        },
    })
}

export function usePipelineDetailQuery(
    engine: CapsDataEngine,
    id: string | undefined,
    idReady: boolean
) {
    return useQuery({
        queryKey: capsKeys.pipeline.detail(id),
        queryFn: () => getPipeline(engine, id!),
        enabled: idReady,
    })
}

export function usePipelineExecutionsTabQuery(
    engine: CapsDataEngine,
    args: {
        id: string | undefined
        idReady: boolean
        execStatusFilter: string
        execPage: number
        execPageSize: number
    }
) {
    const { id, idReady, execStatusFilter, execPage, execPageSize } = args
    return useQuery({
        queryKey: capsKeys.executions.list({
            pipelineId: id,
            status: execStatusFilter,
            page: execPage,
            pageSize: execPageSize,
        }),
        queryFn: () =>
            listExecutions(engine, {
                pipelineId: id!,
                status: execStatusFilter
                    ? (execStatusFilter as PipelineExecutionStatus)
                    : undefined,
                page: execPage,
                pageSize: execPageSize,
            }),
        enabled: idReady,
    })
}
