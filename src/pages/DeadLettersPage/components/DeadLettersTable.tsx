import i18n from '@dhis2/d2-i18n'
import {
    Button,
    DataTable,
    DataTableBody,
    DataTableCell,
    DataTableColumnHeader,
    DataTableHead,
    DataTableRow,
    IconRedo16,
    Tag,
    Tooltip,
} from '@dhis2/ui'
import React from 'react'
import classes from '../DeadLettersPage.module.css'
import { TableScroll } from '@/shared/components/ui/TableScroll'
import type { ExecutionLog } from '@/shared/types/caps'
import { formatLogLevel, logLevelTagProps } from '@/shared/utils/label.utils'

const formatDate = (iso: string) => new Date(iso).toLocaleString()

type Props = {
    deadLetters: ExecutionLog[]
}

export function DeadLettersTable({ deadLetters }: Props): React.ReactElement {
    return (
        <TableScroll label={i18n.t('Dead letters table')}>
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
                            {i18n.t('Metadata')}
                        </DataTableColumnHeader>
                        <DataTableColumnHeader>
                            {i18n.t('Logged At')}
                        </DataTableColumnHeader>
                        <DataTableColumnHeader>
                            {i18n.t('Actions')}
                        </DataTableColumnHeader>
                    </DataTableRow>
                </DataTableHead>
                <DataTableBody>
                    {deadLetters.map((dl) => (
                        <DataTableRow key={dl.id}>
                            <DataTableCell>
                                <Tag {...logLevelTagProps(dl.level)}>
                                    {formatLogLevel(dl.level)}
                                </Tag>
                            </DataTableCell>
                            <DataTableCell>
                                <Tooltip content={dl.message}>
                                    <span
                                        className={classes.message}
                                        aria-label={dl.message}
                                    >
                                        {dl.message.length > 80
                                            ? `${dl.message.slice(0, 80)}…`
                                            : dl.message}
                                    </span>
                                </Tooltip>
                            </DataTableCell>
                            <DataTableCell>
                                {dl.metadata ? (
                                    <code className={classes.metaCode}>
                                        {JSON.stringify(dl.metadata).slice(
                                            0,
                                            60
                                        )}
                                        {JSON.stringify(dl.metadata).length > 60
                                            ? '…'
                                            : ''}
                                    </code>
                                ) : (
                                    <span className={classes.muted}>—</span>
                                )}
                            </DataTableCell>
                            <DataTableCell>
                                {formatDate(dl.loggedAt)}
                            </DataTableCell>
                            <DataTableCell>
                                <Button
                                    small
                                    icon={<IconRedo16 />}
                                    onClick={() => {}}
                                >
                                    {i18n.t('Replay')}
                                </Button>
                            </DataTableCell>
                        </DataTableRow>
                    ))}
                </DataTableBody>
            </DataTable>
        </TableScroll>
    )
}
