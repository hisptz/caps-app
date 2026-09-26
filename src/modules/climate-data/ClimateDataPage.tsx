import { useDataEngine } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import { Button, ButtonStrip, IconAdd16, NoticeBox } from '@dhis2/ui'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import classes from './ClimateDataPage.module.css'
import { CapsApiError } from '@/capsApi/client'
import type { ClimateDatasetRecord } from '@/capsApi/types'
import { ClimateDatasetDetailModal } from '@/modules/climate-data/components/ClimateDatasetDetailModal'
import { ClimateDatasetsTable } from '@/modules/climate-data/components/ClimateDatasetsTable'
import { ClimateJobProgressBanner } from '@/modules/climate-data/components/ClimateJobProgressBanner'
import { CreateIngestionModal } from '@/modules/climate-data/components/CreateIngestionModal'
import { SyncDatasetConfirmModal } from '@/modules/climate-data/components/SyncDatasetConfirmModal'
import { useClimateDatasetsQuery } from '@/modules/climate-data/hooks/useClimateDatasetsQuery'
import {
    isAsyncJobAccepted,
    mapClimateMutationError,
    useClimateIngestionMutations,
} from '@/modules/climate-data/hooks/useClimateIngestionMutations'
import {
    isActiveJobStatus,
    useClimateJobsPolling,
} from '@/modules/climate-data/hooks/useClimateJobPolling'
import { useClimateJobsTracker } from '@/modules/climate-data/hooks/useClimateJobsTracker'
import { useClimateTemplatesQuery } from '@/modules/climate-data/hooks/useClimateTemplatesQuery'
import { useSystemInfoQuery } from '@/modules/monitoring/hooks/capsMonitoringHooks'
import { PageLoader } from '@/shared/components/ui/PageLoader'
import shellClasses from '@/shared/components/ui/PageShell/PageShell.module.css'

const SUCCESS_BANNER_TIMEOUT_MS = 2000
function climateUnavailableMessage(error: unknown): string {
    if (error instanceof CapsApiError) {
        return error.message
    }
    return i18n.t('The climate API is unavailable.')
}

const ClimateDataPage: React.FC = () => {
    const engine = useDataEngine()

    const [showCreateModal, setShowCreateModal] = useState(false)
    const [detailTarget, setDetailTarget] =
        useState<ClimateDatasetRecord | null>(null)
    const [syncTarget, setSyncTarget] = useState<ClimateDatasetRecord | null>(
        null
    )
    const [syncError, setSyncError] = useState<string | null>(null)

    const {
        searchParams,
        setSearchParams,
        jobs,
        jobIds,
        jobIdByDatasetId,
        addJob,
        removeJob,
    } = useClimateJobsTracker()

    const datasetsQuery = useClimateDatasetsQuery(engine)
    const templatesQuery = useClimateTemplatesQuery(engine)
    const systemInfoQuery = useSystemInfoQuery(engine)
    const jobResults = useClimateJobsPolling(engine, jobIds)
    const {
        createIngestionMutation,
        syncDatasetMutation,
        cancelJobMutation,
        invalidateDatasets,
    } = useClimateIngestionMutations(engine)

    const datasets = datasetsQuery.data?.items ?? []
    const climateReadOnly =
        systemInfoQuery.data?.caps.climateApi.info?.read_only === true

    useEffect(() => {
        if (searchParams.get('create') === '1' && !climateReadOnly) {
            setShowCreateModal(true)
        }
    }, [searchParams, climateReadOnly])

    const settledJobIds = useRef<Set<string>>(new Set())
    const dismissTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(
        new Map()
    )

    useEffect(() => {
        for (const { jobId, job } of jobResults) {
            if (
                job?.status !== 'successful' ||
                settledJobIds.current.has(jobId)
            ) {
                continue
            }
            settledJobIds.current.add(jobId)
            void invalidateDatasets()

            const timer = setTimeout(() => {
                dismissTimers.current.delete(jobId)
                removeJob(jobId)
            }, SUCCESS_BANNER_TIMEOUT_MS)
            dismissTimers.current.set(jobId, timer)
        }
    }, [jobResults, invalidateDatasets, removeJob])

    useEffect(() => {
        const timers = dismissTimers.current
        return () => {
            for (const timer of timers.values()) {
                clearTimeout(timer)
            }
            timers.clear()
        }
    }, [])

    const datasetLabelFor = useCallback(
        (datasetId: string | null) => {
            if (!datasetId) {
                return null
            }
            const match = datasets.find((d) => d.dataset_id === datasetId)
            return match?.short_name ?? match?.dataset_name ?? datasetId
        },
        [datasets]
    )

    const activeDatasetJobIds = useMemo(() => {
        const map: Record<string, string> = {}
        for (const [datasetId, jobId] of Object.entries(jobIdByDatasetId)) {
            const result = jobResults.find((r) => r.jobId === jobId)
            if (!result?.job || isActiveJobStatus(result.job.status)) {
                map[datasetId] = jobId
            }
        }
        return map
    }, [jobIdByDatasetId, jobResults])

    const hasActiveJob = useMemo(
        () =>
            jobIds.some((jobId) => {
                const result = jobResults.find((r) => r.jobId === jobId)
                return !result?.job || isActiveJobStatus(result.job.status)
            }),
        [jobIds, jobResults]
    )
    const mutationsDisabled = climateReadOnly || hasActiveJob

    const handleCloseCreateModal = () => {
        setShowCreateModal(false)
        setSearchParams(
            (prev) => {
                const next = new URLSearchParams(prev)
                next.delete('create')
                return next
            },
            { replace: true }
        )
    }

    const handleOpenCreateModal = () => {
        setShowCreateModal(true)
        setSearchParams(
            (prev) => {
                const next = new URLSearchParams(prev)
                next.set('create', '1')
                return next
            },
            { replace: true }
        )
    }

    const handleSyncConfirm = () => {
        if (!syncTarget) {
            return
        }
        setSyncError(null)
        syncDatasetMutation.mutate(
            { datasetId: syncTarget.dataset_id },
            {
                onSuccess: (result) => {
                    if (isAsyncJobAccepted(result)) {
                        addJob(result.jobId, syncTarget.dataset_id)
                        setSyncTarget(null)
                        return
                    }
                    void invalidateDatasets()
                    setSyncTarget(null)
                },
                onError: (err) => {
                    setSyncError(mapClimateMutationError(err))
                },
            }
        )
    }

    const handleCancelJob = (jobId: string) => {
        cancelJobMutation.mutate(jobId)
    }

    return (
        <div className={shellClasses.pageRoot}>
            <div className={classes.header}>
                <h2>{i18n.t('Climate data')}</h2>
                <ButtonStrip>
                    <Button
                        primary
                        icon={<IconAdd16 />}
                        onClick={handleOpenCreateModal}
                        disabled={mutationsDisabled}
                    >
                        {i18n.t('New dataset')}
                    </Button>
                </ButtonStrip>
            </div>

            {climateReadOnly && (
                <div className={classes.banner}>
                    <NoticeBox
                        title={i18n.t('Open Climate Service is read-only')}
                    >
                        {i18n.t(
                            'This Open Climate Service instance does not accept ingestions or syncs.'
                        )}
                    </NoticeBox>
                </div>
            )}

            {jobs.map((tracked) => {
                const result = jobResults.find((r) => r.jobId === tracked.jobId)
                return (
                    <div className={classes.banner} key={tracked.jobId}>
                        <ClimateJobProgressBanner
                            job={result?.job}
                            loading={result?.isLoading}
                            datasetLabel={datasetLabelFor(tracked.datasetId)}
                            onCancel={() => handleCancelJob(tracked.jobId)}
                            onDismiss={() => removeJob(tracked.jobId)}
                            cancelPending={cancelJobMutation.isPending}
                        />
                    </div>
                )
            })}
            {datasetsQuery.isLoading && <PageLoader variant="content" />}
            {datasetsQuery.isError && (
                <NoticeBox
                    error
                    title={i18n.t('Could not load climate datasets')}
                >
                    {climateUnavailableMessage(datasetsQuery.error)}{' '}
                    <Link to="/settings">{i18n.t('Check CAPS settings')}</Link>
                </NoticeBox>
            )}

            {!datasetsQuery.isLoading &&
                !datasetsQuery.isError &&
                datasets.length === 0 && (
                    <NoticeBox title={i18n.t('No datasets yet')}>
                        {i18n.t(
                            'Create a managed dataset from a template to get started.'
                        )}
                    </NoticeBox>
                )}

            {!datasetsQuery.isLoading &&
                !datasetsQuery.isError &&
                datasets.length > 0 && (
                    <ClimateDatasetsTable
                        datasets={datasets}
                        activeDatasetJobIds={activeDatasetJobIds}
                        onViewDetails={setDetailTarget}
                        onSync={(dataset) => {
                            setSyncError(null)
                            setSyncTarget(dataset)
                        }}
                        onCancelJob={handleCancelJob}
                        cancelJobPending={cancelJobMutation.isPending}
                        mutationsDisabled={mutationsDisabled}
                    />
                )}

            <CreateIngestionModal
                open={showCreateModal}
                onClose={handleCloseCreateModal}
                engine={engine}
                templates={templatesQuery.data ?? []}
                templatesLoading={templatesQuery.isLoading}
                createMutation={createIngestionMutation}
                onJobAccepted={(jobId, datasetId) => {
                    setShowCreateModal(false)
                    addJob(jobId, datasetId)
                }}
            />

            <ClimateDatasetDetailModal
                dataset={detailTarget}
                onClose={() => setDetailTarget(null)}
            />

            <SyncDatasetConfirmModal
                dataset={syncTarget}
                onClose={() => {
                    setSyncTarget(null)
                    setSyncError(null)
                }}
                onConfirm={handleSyncConfirm}
                isPending={syncDatasetMutation.isPending}
                errorMessage={syncError}
            />
        </div>
    )
}

export default ClimateDataPage
