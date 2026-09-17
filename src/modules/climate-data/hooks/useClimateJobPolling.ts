import { useQueries, useQuery } from '@tanstack/react-query'
import type { CapsDataEngine } from '@/capsApi/client'
import { getClimateIngestionJob } from '@/capsApi/endpoints'
import { capsKeys } from '@/capsApi/queryKeys'
import type { ClimateJobRecord, ClimateJobStatus } from '@/capsApi/types'

const ACTIVE_JOB_STATUSES: ClimateJobStatus[] = [
    'accepted',
    'running',
    'retrying',
]

const JOB_POLL_INTERVAL_MS = 2500

export function isActiveJobStatus(
    status: ClimateJobStatus | undefined
): boolean {
    return status !== undefined && ACTIVE_JOB_STATUSES.includes(status)
}

export function isTerminalJobStatus(
    status: ClimateJobStatus | undefined
): boolean {
    return status !== undefined && !isActiveJobStatus(status)
}

export function useClimateJobPolling(
    engine: CapsDataEngine,
    jobId: string | null
) {
    return useQuery({
        queryKey: capsKeys.climateJobs.detail(jobId ?? undefined),
        queryFn: () => getClimateIngestionJob(engine, jobId!),
        enabled: Boolean(jobId),
        refetchInterval: (data) => {
            const status = data?.status
            if (!status || !isActiveJobStatus(status)) {
                return false
            }
            return JOB_POLL_INTERVAL_MS
        },
    })
}

export type ClimateJobPollResult = {
    jobId: string
    job: ClimateJobRecord | undefined
    isLoading: boolean
    isError: boolean
}

export function useClimateJobsPolling(
    engine: CapsDataEngine,
    jobIds: string[]
): ClimateJobPollResult[] {
    const results = useQueries({
        queries: jobIds.map((jobId) => ({
            queryKey: capsKeys.climateJobs.detail(jobId),
            queryFn: () => getClimateIngestionJob(engine, jobId),
            refetchInterval: (data: ClimateJobRecord | undefined) => {
                if (!isActiveJobStatus(data?.status)) {
                    return false as const
                }
                return JOB_POLL_INTERVAL_MS
            },
        })),
    })

    return jobIds.map((jobId, index) => {
        const result = results[index]
        return {
            jobId,
            job: result?.data,
            isLoading: Boolean(result?.isLoading),
            isError: Boolean(result?.isError),
        }
    })
}
