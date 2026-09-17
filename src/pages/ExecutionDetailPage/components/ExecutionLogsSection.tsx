import i18n from '@dhis2/d2-i18n'
import {
    DataTable,
    DataTableBody,
    DataTableCell,
    DataTableColumnHeader,
    DataTableHead,
    DataTableRow,
    NoticeBox,
    Tag,
} from '@dhis2/ui'
import React from 'react'
import classes from '../ExecutionDetailPage.module.css'
import { formatDate } from '@/modules/pipeline-detail/utils/formatLabels'
import { TableScroll } from '@/shared/components/ui/TableScroll'
import type { ExecutionLog } from '@/shared/types/caps'
import { formatLogLevel, logLevelTagProps } from '@/shared/utils/label.utils'

type Props = {
    logs: ExecutionLog[]
}

export function ExecutionLogsSection({ logs }: Props): React.ReactElement {
    return (
        <section className={classes.section}>
            <h3>{i18n.t('Execution Logs')}</h3>
            {logs.length === 0 ? (
                <NoticeBox title={i18n.t('No logs')}>
                    {i18n.t('No log lines recorded for this execution yet.')}
                </NoticeBox>
            ) : (
                <TableScroll label={i18n.t('Execution logs table')}>
                    <DataTable>
                        <DataTableHead>
                            <DataTableRow>
                                <DataTableColumnHeader>
                                    {i18n.t('Level')}
                                </DataTableColumnHeader>
                                <DataTableColumnHeader>
                                    {i18n.t('Message')}
                                </DataTableColumnHeader>
                                <DataTableColumnHeader>
                                    {i18n.t('Time')}
                                </DataTableColumnHeader>
                            </DataTableRow>
                        </DataTableHead>
                        <DataTableBody>
                            {logs.map((log) => (
                                <DataTableRow key={log.id}>
                                    <DataTableCell>
                                        <Tag {...logLevelTagProps(log.level)}>
                                            {formatLogLevel(log.level)}
                                        </Tag>
                                    </DataTableCell>
                                    <DataTableCell>{log.message}</DataTableCell>
                                    <DataTableCell>
                                        {formatDate(log.loggedAt)}
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
