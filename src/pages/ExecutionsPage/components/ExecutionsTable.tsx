import i18n from '@dhis2/d2-i18n'
import {
    DataTable,
    DataTableBody,
    DataTableCell,
    DataTableColumnHeader,
    DataTableHead,
    DataTableRow,
} from '@dhis2/ui'
import React from 'react'
import { Link } from 'react-router'
import {
    durationLabel,
    formatDate,
} from '@/modules/pipeline-detail/utils/formatLabels'
import { StatusTag } from '@/shared/components/ui/StatusTag'
import tableNavLinkClasses from '@/shared/components/ui/TableNavLink/TableNavLink.module.css'
import { TableScroll } from '@/shared/components/ui/TableScroll'
import type { PipelineExecution } from '@/shared/types/caps'

type Props = {
    executions: PipelineExecution[]
}

export function ExecutionsTable({ executions }: Props): React.ReactElement {
    return (
        <TableScroll label={i18n.t('Executions table')}>
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
                                <Link
                                    to={`/executions/${exec.id}`}
                                    className={tableNavLinkClasses.link}
                                >
                                    <code>{exec.id.slice(0, 8)}…</code>
                                </Link>
                            </DataTableCell>
                            <DataTableCell>
                                {exec.pipeline?.name ?? exec.pipelineId}
                            </DataTableCell>
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
                                {durationLabel(exec.startedAt, exec.finishedAt)}
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
    )
}
