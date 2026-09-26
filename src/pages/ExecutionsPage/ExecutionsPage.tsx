import { useDataEngine } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import { NoticeBox, Pagination } from '@dhis2/ui'
import React, { useState } from 'react'
import { ExecutionsFilters } from './components/ExecutionsFilters'
import { ExecutionsTable } from './components/ExecutionsTable'
import classes from './ExecutionsPage.module.css'
import { CapsApiError } from '@/capsApi/client'
import { paginationToPageCount } from '@/capsApi/types'
import { useExecutionsPageQueries } from '@/modules/monitoring/hooks/capsMonitoringHooks'
import { PageLoader } from '@/shared/components/ui/PageLoader'
import shellClasses from '@/shared/components/ui/PageShell/PageShell.module.css'

const ExecutionsPage: React.FC = () => {
    const engine = useDataEngine()
    const [pipelineId, setPipelineId] = useState('')
    const [status, setStatus] = useState('')
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(20)

    const { pipelinesFilterQuery, executionsQuery } = useExecutionsPageQueries(
        engine,
        {
            pipelineId,
            status,
            page,
            pageSize,
        }
    )
    const pipelinesData = pipelinesFilterQuery.data
    const pipelineOptions = pipelinesData?.pipelines ?? []
    const { data: execData, isLoading, isError, error } = executionsQuery

    const rows = execData?.executions ?? []
    const pagination = execData?.pagination
    const pageCount = pagination ? paginationToPageCount(pagination) : 1
    const total = pagination?.total ?? 0

    const filtersActive = Boolean(pipelineId || status)

    return (
        <div className={shellClasses.pageRoot}>
            <div className={classes.header}>
                <h2>{i18n.t('Executions')}</h2>
            </div>

            <ExecutionsFilters
                pipelineOptions={pipelineOptions}
                pipelineId={pipelineId}
                status={status}
                onPipelineChange={(next) => {
                    setPipelineId(next)
                    setPage(1)
                }}
                onStatusChange={(next) => {
                    setStatus(next)
                    setPage(1)
                }}
            />

            {isLoading && !execData && <PageLoader variant="content" />}

            {isError && error instanceof CapsApiError && (
                <NoticeBox error title={i18n.t('Could not load executions')}>
                    {error.message}
                </NoticeBox>
            )}

            {!isLoading && !isError && rows.length === 0 ? (
                <NoticeBox title={i18n.t('No executions match')}>
                    {filtersActive
                        ? i18n.t('Try changing the pipeline or status filters.')
                        : i18n.t('No executions are available yet.')}
                </NoticeBox>
            ) : (
                !isLoading && !isError && <ExecutionsTable executions={rows} />
            )}

            {!isLoading && !isError && total > 0 && (
                <div className={classes.pagination}>
                    <Pagination
                        page={page}
                        pageCount={pageCount}
                        pageSize={pageSize}
                        total={total}
                        onPageChange={(n: number) => setPage(n)}
                        onPageSizeChange={(n: number) => {
                            setPageSize(n)
                            setPage(1)
                        }}
                    />
                </div>
            )}
        </div>
    )
}

export default ExecutionsPage
