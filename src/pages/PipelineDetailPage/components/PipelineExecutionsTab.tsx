import i18n from '@dhis2/d2-i18n'
import {
    DataTable,
    DataTableBody,
    DataTableCell,
    DataTableColumnHeader,
    DataTableHead,
    DataTableRow,
    NoticeBox,
    Pagination,
    SingleSelectField,
    SingleSelectOption,
} from '@dhis2/ui'
import React from 'react'
import { Link } from 'react-router'
import classes from '../PipelineDetailPage.module.css'
import type { PipelineExecutionSummary } from '@/capsApi/types'
import {
    durationLabel,
    formatDate,
} from '@/modules/pipeline-detail/utils/formatLabels'
import { PageLoader } from '@/shared/components/ui/PageLoader'
import { StatusTag } from '@/shared/components/ui/StatusTag'
import tableNavLinkClasses from '@/shared/components/ui/TableNavLink/TableNavLink.module.css'
import { TableScroll } from '@/shared/components/ui/TableScroll'

type Props = {
    executions: PipelineExecutionSummary[]
    isLoading: boolean
    hasLoadedOnce: boolean
    statusFilter: string
    page: number
    pageCount: number
    pageSize: number
    total: number
    onStatusFilterChange: (status: string) => void
    onPageChange: (page: number) => void
    onPageSizeChange: (pageSize: number) => void
}

export function PipelineExecutionsTab({
    executions,
    isLoading,
    hasLoadedOnce,
    statusFilter,
    page,
    pageCount,
    pageSize,
    total,
    onStatusFilterChange,
    onPageChange,
    onPageSizeChange,
}: Props): React.ReactElement {
    return (
        <>
            <div className={classes.tabActions}>
                <SingleSelectField
                    label={i18n.t('Filter by status')}
                    selected={statusFilter}
                    onChange={({ selected }) =>
                        onStatusFilterChange(selected ?? '')
                    }
                    className={classes.statusFilter}
                >
                    <SingleSelectOption
                        value=""
                        label={i18n.t('All statuses')}
                    />
                    <SingleSelectOption
                        value="PENDING"
                        label={i18n.t('Pending')}
                    />
                    <SingleSelectOption
                        value="RUNNING"
                        label={i18n.t('Running')}
                    />
                    <SingleSelectOption
                        value="AWAITING_STEP"
                        label={i18n.t('Awaiting Step')}
                    />
                    <SingleSelectOption
                        value="COMPLETED"
                        label={i18n.t('Completed')}
                    />
                    <SingleSelectOption
                        value="FAILED"
                        label={i18n.t('Failed')}
                    />
                    <SingleSelectOption
                        value="CANCELLED"
                        label={i18n.t('Cancelled')}
                    />
                    <SingleSelectOption
                        value="PAUSED"
                        label={i18n.t('Paused')}
                    />
                </SingleSelectField>
            </div>
            {isLoading && !hasLoadedOnce ? (
                <PageLoader variant="section" />
            ) : executions.length === 0 ? (
                <NoticeBox title={i18n.t('No executions')}>
                    {statusFilter
                        ? i18n.t('No runs match the selected status.')
                        : i18n.t('This pipeline has not been executed yet.')}
                </NoticeBox>
            ) : (
                <>
                    <TableScroll label={i18n.t('Pipeline executions table')}>
                        <DataTable>
                            <DataTableHead>
                                <DataTableRow>
                                    <DataTableColumnHeader>
                                        {i18n.t('Status')}
                                    </DataTableColumnHeader>
                                    <DataTableColumnHeader>
                                        {i18n.t('Triggered By')}
                                    </DataTableColumnHeader>
                                    <DataTableColumnHeader>
                                        {i18n.t('Started At')}
                                    </DataTableColumnHeader>
                                    <DataTableColumnHeader>
                                        {i18n.t('Duration')}
                                    </DataTableColumnHeader>
                                    <DataTableColumnHeader />
                                </DataTableRow>
                            </DataTableHead>
                            <DataTableBody>
                                {executions.map((exec) => (
                                    <DataTableRow key={exec.id}>
                                        <DataTableCell>
                                            <StatusTag status={exec.status} />
                                        </DataTableCell>
                                        <DataTableCell>
                                            {exec.triggeredBy ?? '—'}
                                        </DataTableCell>
                                        <DataTableCell>
                                            {formatDate(exec.startedAt)}
                                        </DataTableCell>
                                        <DataTableCell>
                                            {durationLabel(
                                                exec.startedAt,
                                                exec.finishedAt
                                            )}
                                        </DataTableCell>
                                        <DataTableCell>
                                            <Link
                                                to={`/executions/${exec.id}`}
                                                className={
                                                    tableNavLinkClasses.link
                                                }
                                            >
                                                {i18n.t('View')}
                                            </Link>
                                        </DataTableCell>
                                    </DataTableRow>
                                ))}
                            </DataTableBody>
                        </DataTable>
                    </TableScroll>
                    {total > 0 && (
                        <div className={classes.pagination}>
                            <Pagination
                                page={page}
                                pageCount={pageCount}
                                pageSize={pageSize}
                                total={total}
                                onPageChange={onPageChange}
                                onPageSizeChange={onPageSizeChange}
                            />
                        </div>
                    )}
                </>
            )}
        </>
    )
}
