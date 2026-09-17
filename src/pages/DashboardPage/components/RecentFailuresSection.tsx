import i18n from '@dhis2/d2-i18n'
import {
    DataTable,
    DataTableBody,
    DataTableCell,
    DataTableColumnHeader,
    DataTableHead,
    DataTableRow,
    NoticeBox,
} from '@dhis2/ui'
import React from 'react'
import { Link } from 'react-router'
import classes from '../DashboardPage.module.css'
import { formatDate } from '@/modules/pipeline-detail/utils/formatLabels'
import tableNavLinkClasses from '@/shared/components/ui/TableNavLink/TableNavLink.module.css'
import { TableScroll } from '@/shared/components/ui/TableScroll'
import type { PipelineExecution } from '@/shared/types/caps'

type Props = {
    recentFailures: PipelineExecution[]
}

export function RecentFailuresSection({
    recentFailures,
}: Props): React.ReactElement {
    return (
        <section className={classes.section}>
            <h3>{i18n.t('Recent Failures')}</h3>
            {recentFailures.length === 0 ? (
                <NoticeBox title={i18n.t('No recent failures')}>
                    {i18n.t('No pipeline failures in the last 24 hours.')}
                </NoticeBox>
            ) : (
                <TableScroll label={i18n.t('Recent failures table')}>
                    <DataTable>
                        <DataTableHead>
                            <DataTableRow>
                                <DataTableColumnHeader>
                                    {i18n.t('Execution ID')}
                                </DataTableColumnHeader>
                                <DataTableColumnHeader>
                                    {i18n.t('Pipeline')}
                                </DataTableColumnHeader>
                                <DataTableColumnHeader>
                                    {i18n.t('Failed At')}
                                </DataTableColumnHeader>
                                <DataTableColumnHeader>
                                    {i18n.t('Triggered By')}
                                </DataTableColumnHeader>
                                <DataTableColumnHeader />
                            </DataTableRow>
                        </DataTableHead>
                        <DataTableBody>
                            {recentFailures.map((exec) => (
                                <DataTableRow key={exec.id}>
                                    <DataTableCell>
                                        <code>{exec.id.slice(0, 8)}…</code>
                                    </DataTableCell>
                                    <DataTableCell>
                                        {exec.pipeline?.name ?? exec.pipelineId}
                                    </DataTableCell>
                                    <DataTableCell>
                                        {formatDate(exec.finishedAt)}
                                    </DataTableCell>
                                    <DataTableCell>
                                        {exec.triggeredBy ?? '—'}
                                    </DataTableCell>
                                    <DataTableCell>
                                        <Link
                                            to={`/executions/${exec.id}`}
                                            className={tableNavLinkClasses.link}
                                        >
                                            {i18n.t('View')}
                                        </Link>
                                    </DataTableCell>
                                </DataTableRow>
                            ))}
                        </DataTableBody>
                    </DataTable>
                </TableScroll>
            )}
        </section>
    )
}
