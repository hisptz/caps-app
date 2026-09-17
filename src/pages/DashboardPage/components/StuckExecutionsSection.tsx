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
import { StatusTag } from '@/shared/components/ui/StatusTag'
import tableNavLinkClasses from '@/shared/components/ui/TableNavLink/TableNavLink.module.css'
import { TableScroll } from '@/shared/components/ui/TableScroll'
import type { PipelineExecution } from '@/shared/types/caps'

type Props = {
    stuckExecutions: PipelineExecution[]
}

export function StuckExecutionsSection({
    stuckExecutions,
}: Props): React.ReactElement {
    return (
        <section className={classes.section}>
            <h3>{i18n.t('Stuck Executions')}</h3>
            {stuckExecutions.length === 0 ? (
                <NoticeBox title={i18n.t('No stuck executions')}>
                    {i18n.t(
                        'All pipeline executions are progressing normally.'
                    )}
                </NoticeBox>
            ) : (
                <TableScroll label={i18n.t('Stuck executions table')}>
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
                                    {i18n.t('Status')}
                                </DataTableColumnHeader>
                                <DataTableColumnHeader>
                                    {i18n.t('Started At')}
                                </DataTableColumnHeader>
                            </DataTableRow>
                        </DataTableHead>
                        <DataTableBody>
                            {stuckExecutions.map((exec) => (
                                <DataTableRow key={exec.id}>
                                    <DataTableCell>
                                        <Link
                                            to={`/executions/${exec.id}`}
                                            className={tableNavLinkClasses.link}
                                        >
                                            {exec.id.slice(0, 8)}…
                                        </Link>
                                    </DataTableCell>
                                    <DataTableCell>
                                        {exec.pipeline?.name ?? exec.pipelineId}
                                    </DataTableCell>
                                    <DataTableCell>
                                        <StatusTag status={exec.status} />
                                    </DataTableCell>
                                    <DataTableCell>
                                        {formatDate(exec.startedAt)}
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
