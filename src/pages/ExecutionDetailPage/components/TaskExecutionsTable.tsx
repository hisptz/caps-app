import i18n from '@dhis2/d2-i18n'
import {
    Button,
    DataTable,
    DataTableBody,
    DataTableCell,
    DataTableColumnHeader,
    DataTableHead,
    DataTableRow,
    IconErrorFilled16,
    NoticeBox,
} from '@dhis2/ui'
import React from 'react'
import classes from '../ExecutionDetailPage.module.css'
import { IoJsonGrid } from './IoJsonGrid'
import {
    durationLabel,
    formatDate,
} from '@/modules/pipeline-detail/utils/formatLabels'
import { StatusTag } from '@/shared/components/ui/StatusTag'
import { TableScroll } from '@/shared/components/ui/TableScroll'
import type { TaskExecution } from '@/shared/types/caps'

type Props = {
    tasks: TaskExecution[]
    expandedTasks: Set<string>
    onToggleTask: (taskId: string) => void
    onViewTaskError: (task: TaskExecution) => void
}

export function TaskExecutionsTable({
    tasks,
    expandedTasks,
    onToggleTask,
    onViewTaskError,
}: Props): React.ReactElement {
    return (
        <>
            <h4>{i18n.t('Task Executions')}</h4>
            <TableScroll label={i18n.t('Task executions for step')}>
                <DataTable>
                    <DataTableHead>
                        <DataTableRow>
                            <DataTableColumnHeader />
                            <DataTableColumnHeader>
                                {i18n.t('Name')}
                            </DataTableColumnHeader>
                            <DataTableColumnHeader>
                                {i18n.t('Status')}
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
                        {tasks.map((task) => (
                            <DataTableRow
                                key={task.id}
                                expanded={expandedTasks.has(task.id)}
                                onExpandToggle={() => onToggleTask(task.id)}
                                expandableContent={
                                    <div className={classes.stepBody}>
                                        {task.errorMessage && (
                                            <NoticeBox
                                                error
                                                title={i18n.t('Task failed')}
                                            >
                                                {task.errorMessage}
                                            </NoticeBox>
                                        )}
                                        <IoJsonGrid
                                            input={task.input}
                                            output={task.output}
                                        />
                                    </div>
                                }
                            >
                                <DataTableCell>{task.name}</DataTableCell>
                                <DataTableCell>
                                    <StatusTag status={task.status} />
                                </DataTableCell>
                                <DataTableCell>
                                    {formatDate(task.startedAt)}
                                </DataTableCell>
                                <DataTableCell>
                                    {durationLabel(
                                        task.startedAt,
                                        task.finishedAt
                                    )}
                                </DataTableCell>
                                <DataTableCell>
                                    {task.errorMessage && (
                                        <Button
                                            small
                                            icon={<IconErrorFilled16 />}
                                            onClick={() =>
                                                onViewTaskError(task)
                                            }
                                        >
                                            {i18n.t('View error')}
                                        </Button>
                                    )}
                                </DataTableCell>
                            </DataTableRow>
                        ))}
                    </DataTableBody>
                </DataTable>
            </TableScroll>
        </>
    )
}
