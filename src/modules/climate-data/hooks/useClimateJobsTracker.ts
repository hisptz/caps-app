import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'

export type TrackedClimateJob = {
    jobId: string
    datasetId: string | null
}

const JOBS_PARAM = 'jobs'
const LEGACY_JOB_PARAM = 'jobId'
const PAIR_SEPARATOR = '~'

export function serialiseJobs(jobs: TrackedClimateJob[]): string {
    return jobs
        .map((job) =>
            job.datasetId
                ? `${job.jobId}${PAIR_SEPARATOR}${job.datasetId}`
                : job.jobId
        )
        .join(',')
}

export function parseJobs(raw: string | null): TrackedClimateJob[] {
    if (!raw) {
        return []
    }
    const seen = new Set<string>()
    return raw
        .split(',')
        .map((chunk) => chunk.trim())
        .filter(Boolean)
        .map((chunk) => {
            const [jobId, datasetId] = chunk.split(PAIR_SEPARATOR)
            return { jobId, datasetId: datasetId || null }
        })
        .filter((job) => {
            if (!job.jobId || seen.has(job.jobId)) {
                return false
            }
            seen.add(job.jobId)
            return true
        })
}

function readJobsFromParams(params: URLSearchParams): TrackedClimateJob[] {
    const fromJobs = parseJobs(params.get(JOBS_PARAM))
    if (fromJobs.length > 0) {
        return fromJobs
    }
    return parseJobs(params.get(LEGACY_JOB_PARAM))
}

export function useClimateJobsTracker() {
    const [searchParams, setSearchParams] = useSearchParams()

    const jobs = useMemo(() => readJobsFromParams(searchParams), [searchParams])

    const jobIds = useMemo(() => jobs.map((job) => job.jobId), [jobs])

    const jobIdByDatasetId = useMemo(() => {
        const map: Record<string, string> = {}
        for (const job of jobs) {
            if (job.datasetId) {
                map[job.datasetId] = job.jobId
            }
        }
        return map
    }, [jobs])

    const writeJobs = useCallback(
        (
            update: (current: TrackedClimateJob[]) => TrackedClimateJob[],
            alsoApply?: (params: URLSearchParams) => void
        ) => {
            setSearchParams(
                (prev) => {
                    const next = new URLSearchParams(prev)
                    const updated = update(readJobsFromParams(next))
                    next.delete(LEGACY_JOB_PARAM)
                    if (updated.length > 0) {
                        next.set(JOBS_PARAM, serialiseJobs(updated))
                    } else {
                        next.delete(JOBS_PARAM)
                    }
                    alsoApply?.(next)
                    return next
                },
                { replace: true }
            )
        },
        [setSearchParams]
    )

    const addJob = useCallback(
        (jobId: string, datasetId?: string | null) => {
            writeJobs(
                (current) => [
                    ...current.filter((job) => job.jobId !== jobId),
                    { jobId, datasetId: datasetId ?? null },
                ],
                (params) => params.delete('create')
            )
        },
        [writeJobs]
    )

    const removeJob = useCallback(
        (jobId: string) => {
            writeJobs((current) => current.filter((job) => job.jobId !== jobId))
        },
        [writeJobs]
    )

    return {
        searchParams,
        setSearchParams,
        jobs,
        jobIds,
        jobIdByDatasetId,
        addJob,
        removeJob,
    }
}
