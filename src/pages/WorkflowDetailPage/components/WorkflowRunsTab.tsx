import { useDataEngine } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import {
    Button,
    DataTable,
    DataTableBody,
    DataTableCell,
    DataTableColumnHeader,
    DataTableHead,
    DataTableRow,
    NoticeBox,
    Pagination,
} from '@dhis2/ui'
import React, { useState } from 'react'
import { paginationToPageCount } from '@/capsApi/types'
import { formatDate } from '@/modules/pipeline-detail/utils/formatLabels'
import { WorkflowRunModal } from '@/modules/workflows/components/WorkflowRunModal'
import { useWorkflowRunsQuery } from '@/modules/workflows/hooks/useWorkflows'
import {
    formatRunPeriod,
    formatWorkflowTrigger,
} from '@/modules/workflows/utils/workflowLabels'
import classes from '@/pages/PipelineDetailPage/PipelineDetailPage.module.css'
import { PageLoader } from '@/shared/components/ui/PageLoader'
import { StatusTag } from '@/shared/components/ui/StatusTag'
import { TableScroll } from '@/shared/components/ui/TableScroll'

type Props = {
    workflowId: string
}

export function WorkflowRunsTab({ workflowId }: Props): React.ReactElement {
    const engine = useDataEngine()
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(20)
    const [openRunId, setOpenRunId] = useState<string | null>(null)
    const { data, isLoading, isError, error } = useWorkflowRunsQuery(
        engine,
        workflowId,
        { page, pageSize }
    )
    const runs = data?.items ?? []

    if (isLoading) {
        return <PageLoader variant="content" />
    }
    if (isError) {
        return (
            <NoticeBox error title={i18n.t('Could not load runs')}>
                {error instanceof Error ? error.message : null}
            </NoticeBox>
        )
    }
    if (runs.length === 0) {
        return (
            <NoticeBox title={i18n.t('No runs yet')}>
                {i18n.t(
                    'Each start of the workflow, by its schedule or the Run button, shows here.'
                )}
            </NoticeBox>
        )
    }

    return (
        <>
            <TableScroll label={i18n.t('Workflow runs table')}>
                <DataTable>
                    <DataTableHead>
                        <DataTableRow>
                            <DataTableColumnHeader>
                                {i18n.t('Started')}
                            </DataTableColumnHeader>
                            <DataTableColumnHeader>
                                {i18n.t('Started by')}
                            </DataTableColumnHeader>
                            <DataTableColumnHeader>
                                {i18n.t('Status')}
                            </DataTableColumnHeader>
                            <DataTableColumnHeader>
                                {i18n.t('Pipeline runs')}
                            </DataTableColumnHeader>
                            <DataTableColumnHeader>
                                {i18n.t('Finished')}
                            </DataTableColumnHeader>
                            <DataTableColumnHeader>
                                {i18n.t('Actions')}
                            </DataTableColumnHeader>
                        </DataTableRow>
                    </DataTableHead>
                    <DataTableBody>
                        {runs.map((run) => (
                            <DataTableRow key={run.id}>
                                <DataTableCell>
                                    {formatDate(run.createdAt)}
                                </DataTableCell>
                                <DataTableCell>
                                    {formatWorkflowTrigger(run.triggeredBy)}
                                    {run.period &&
                                        ` · ${formatRunPeriod(run.period)}`}
                                </DataTableCell>
                                <DataTableCell>
                                    <StatusTag status={run.status} />
                                </DataTableCell>
                                <DataTableCell>
                                    {run.skipped.length > 0
                                        ? i18n.t(
                                              '{{runs}} ({{skipped}} did not start)',
                                              {
                                                  runs: run.executionCount,
                                                  skipped: run.skipped.length,
                                              }
                                          )
                                        : run.executionCount}
                                </DataTableCell>
                                <DataTableCell>
                                    {formatDate(run.finishedAt)}
                                </DataTableCell>
                                <DataTableCell>
                                    <Button
                                        small
                                        secondary
                                        onClick={() => setOpenRunId(run.id)}
                                    >
                                        {i18n.t('Details')}
                                    </Button>
                                </DataTableCell>
                            </DataTableRow>
                        ))}
                    </DataTableBody>
                </DataTable>
            </TableScroll>

            {data && data.pagination.total > pageSize && (
                <div className={classes.pagination}>
                    <Pagination
                        page={page}
                        pageCount={paginationToPageCount(data.pagination)}
                        pageSize={pageSize}
                        total={data.pagination.total}
                        onPageChange={(n: number) => setPage(n)}
                        onPageSizeChange={(n: number) => {
                            setPageSize(n)
                            setPage(1)
                        }}
                    />
                </div>
            )}

            {openRunId && (
                <WorkflowRunModal
                    runId={openRunId}
                    onClose={() => setOpenRunId(null)}
                />
            )}
        </>
    )
}
