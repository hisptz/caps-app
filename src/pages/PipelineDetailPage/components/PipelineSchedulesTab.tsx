import i18n from '@dhis2/d2-i18n'
import {
    Button,
    ButtonStrip,
    DataTable,
    DataTableBody,
    DataTableCell,
    DataTableColumnHeader,
    DataTableHead,
    DataTableRow,
    IconAdd16,
    IconBlock16,
    IconDelete16,
    IconEdit16,
    IconLaunch16,
    NoticeBox,
} from '@dhis2/ui'
import React from 'react'
import classes from '../PipelineDetailPage.module.css'
import { formatDate } from '@/modules/pipeline-detail/utils/formatLabels'
import { StatusTag } from '@/shared/components/ui/StatusTag'
import { TableScroll } from '@/shared/components/ui/TableScroll'
import type { PipelineSchedule } from '@/shared/types/caps'

type Props = {
    schedules: PipelineSchedule[]
    scheduleActionError: string | null
    pauseDisabled: boolean
    resumeDisabled: boolean
    onAddSchedule: () => void
    onEditSchedule: (schedule: PipelineSchedule) => void
    onPauseSchedule: (schedule: PipelineSchedule) => void
    onResumeSchedule: (schedule: PipelineSchedule) => void
    onDeleteSchedule: (schedule: PipelineSchedule) => void
}

export function PipelineSchedulesTab({
    schedules,
    scheduleActionError,
    pauseDisabled,
    resumeDisabled,
    onAddSchedule,
    onEditSchedule,
    onPauseSchedule,
    onResumeSchedule,
    onDeleteSchedule,
}: Props): React.ReactElement {
    return (
        <>
            <div className={classes.tabActions}>
                <Button icon={<IconAdd16 />} onClick={onAddSchedule}>
                    {i18n.t('Add Schedule')}
                </Button>
            </div>
            {scheduleActionError && (
                <NoticeBox error title={i18n.t('Schedule action failed')}>
                    {scheduleActionError}
                </NoticeBox>
            )}
            {schedules.length === 0 ? (
                <NoticeBox title={i18n.t('No schedules')}>
                    {i18n.t(
                        'Add a schedule to run this pipeline automatically.'
                    )}
                </NoticeBox>
            ) : (
                <TableScroll label={i18n.t('Pipeline schedules table')}>
                    <DataTable>
                        <DataTableHead>
                            <DataTableRow>
                                <DataTableColumnHeader>
                                    {i18n.t('Name')}
                                </DataTableColumnHeader>
                                <DataTableColumnHeader>
                                    {i18n.t('Status')}
                                </DataTableColumnHeader>
                                <DataTableColumnHeader>
                                    {i18n.t('Expression')}
                                </DataTableColumnHeader>
                                <DataTableColumnHeader>
                                    {i18n.t('Last Run')}
                                </DataTableColumnHeader>
                                <DataTableColumnHeader>
                                    {i18n.t('Next Run')}
                                </DataTableColumnHeader>
                                <DataTableColumnHeader>
                                    {i18n.t('Actions')}
                                </DataTableColumnHeader>
                            </DataTableRow>
                        </DataTableHead>
                        <DataTableBody>
                            {schedules.map((sched) => (
                                <DataTableRow key={sched.id}>
                                    <DataTableCell>{sched.name}</DataTableCell>
                                    <DataTableCell>
                                        <StatusTag status={sched.status} />
                                    </DataTableCell>
                                    <DataTableCell>
                                        <code>{sched.cronExpr}</code>
                                    </DataTableCell>
                                    <DataTableCell>
                                        {formatDate(sched.lastRunAt)}
                                    </DataTableCell>
                                    <DataTableCell>
                                        {formatDate(sched.nextRunAt)}
                                    </DataTableCell>
                                    <DataTableCell>
                                        <ButtonStrip>
                                            <Button
                                                small
                                                icon={<IconEdit16 />}
                                                aria-label={i18n.t(
                                                    'Edit schedule'
                                                )}
                                                onClick={() =>
                                                    onEditSchedule(sched)
                                                }
                                            />
                                            {sched.status === 'ACTIVE' && (
                                                <Button
                                                    small
                                                    icon={<IconBlock16 />}
                                                    aria-label={i18n.t(
                                                        'Pause schedule'
                                                    )}
                                                    disabled={pauseDisabled}
                                                    onClick={() =>
                                                        onPauseSchedule(sched)
                                                    }
                                                />
                                            )}
                                            {sched.status === 'PAUSED' && (
                                                <Button
                                                    small
                                                    icon={<IconLaunch16 />}
                                                    aria-label={i18n.t(
                                                        'Resume schedule'
                                                    )}
                                                    disabled={resumeDisabled}
                                                    onClick={() =>
                                                        onResumeSchedule(sched)
                                                    }
                                                />
                                            )}
                                            <Button
                                                small
                                                destructive
                                                icon={<IconDelete16 />}
                                                aria-label={i18n.t(
                                                    'Delete schedule'
                                                )}
                                                onClick={() =>
                                                    onDeleteSchedule(sched)
                                                }
                                            />
                                        </ButtonStrip>
                                    </DataTableCell>
                                </DataTableRow>
                            ))}
                        </DataTableBody>
                    </DataTable>
                </TableScroll>
            )}
        </>
    )
}
