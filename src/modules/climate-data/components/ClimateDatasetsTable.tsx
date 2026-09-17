import i18n from '@dhis2/d2-i18n'
import {
    DataTable,
    DataTableBody,
    DataTableCell,
    DataTableColumnHeader,
    DataTableHead,
    DataTableRow,
    DropdownButton,
    FlyoutMenu,
    IconMore16,
    MenuItem,
    Tag,
} from '@dhis2/ui'
import React from 'react'
import classes from './ClimateDatasetsTable.module.css'
import type { ClimateDatasetRecord } from '@/capsApi/types'
import { formatClimateTemporalExtent } from '@/modules/climate-data/utils/formatTemporalExtent'
import { TableScroll } from '@/shared/components/ui/TableScroll'

type Props = {
    datasets: ClimateDatasetRecord[]
    activeDatasetJobIds: Record<string, string>
    onViewDetails: (dataset: ClimateDatasetRecord) => void
    onSync: (dataset: ClimateDatasetRecord) => void
    onCancelJob: (jobId: string) => void
    cancelJobPending: boolean
    mutationsDisabled?: boolean
}

const formatDate = (iso: string) => new Date(iso).toLocaleString()

export function ClimateDatasetsTable({
    datasets,
    activeDatasetJobIds,
    onViewDetails,
    onSync,
    onCancelJob,
    cancelJobPending,
    mutationsDisabled = false,
}: Props): React.ReactElement {
    return (
        <TableScroll label={i18n.t('Climate datasets')}>
            <DataTable>
                <DataTableHead>
                    <DataTableRow>
                        <DataTableColumnHeader>
                            {i18n.t('Name')}
                        </DataTableColumnHeader>
                        <DataTableColumnHeader>
                            {i18n.t('Variable')}
                        </DataTableColumnHeader>
                        <DataTableColumnHeader>
                            {i18n.t('Period type')}
                        </DataTableColumnHeader>
                        <DataTableColumnHeader>
                            {i18n.t('Temporal extent')}
                        </DataTableColumnHeader>
                        <DataTableColumnHeader>
                            {i18n.t('Last updated')}
                        </DataTableColumnHeader>
                        <DataTableColumnHeader>
                            {i18n.t('Actions')}
                        </DataTableColumnHeader>
                    </DataTableRow>
                </DataTableHead>
                <DataTableBody>
                    {datasets.map((dataset) => {
                        const activeJobId =
                            activeDatasetJobIds[dataset.dataset_id]
                        const hasActiveJob = Boolean(activeJobId)

                        return (
                            <DataTableRow key={dataset.dataset_id}>
                                <DataTableCell>
                                    <span className={classes.nameCell}>
                                        {dataset.short_name ??
                                            dataset.dataset_name}
                                        {hasActiveJob && (
                                            <Tag>{i18n.t('Syncing')}</Tag>
                                        )}
                                    </span>
                                </DataTableCell>
                                <DataTableCell>
                                    {dataset.variable}
                                </DataTableCell>
                                <DataTableCell>
                                    {dataset.period_type}
                                </DataTableCell>
                                <DataTableCell>
                                    {formatClimateTemporalExtent(
                                        dataset.extent.temporal
                                    )}
                                </DataTableCell>
                                <DataTableCell>
                                    {formatDate(dataset.last_updated)}
                                </DataTableCell>
                                <DataTableCell>
                                    <div className={classes.actionsCell}>
                                        <DropdownButton
                                            small
                                            icon={<IconMore16 />}
                                            component={
                                                <FlyoutMenu dense>
                                                    <MenuItem
                                                        label={i18n.t(
                                                            'View details'
                                                        )}
                                                        onClick={() =>
                                                            onViewDetails(
                                                                dataset
                                                            )
                                                        }
                                                    />
                                                    <MenuItem
                                                        label={i18n.t('Sync')}
                                                        disabled={
                                                            mutationsDisabled ||
                                                            hasActiveJob
                                                        }
                                                        onClick={() =>
                                                            onSync(dataset)
                                                        }
                                                    />
                                                    {hasActiveJob && (
                                                        <MenuItem
                                                            destructive
                                                            label={i18n.t(
                                                                'Cancel job'
                                                            )}
                                                            disabled={
                                                                cancelJobPending
                                                            }
                                                            onClick={() =>
                                                                onCancelJob(
                                                                    activeJobId
                                                                )
                                                            }
                                                        />
                                                    )}
                                                </FlyoutMenu>
                                            }
                                        />
                                    </div>
                                </DataTableCell>
                            </DataTableRow>
                        )
                    })}
                </DataTableBody>
            </DataTable>
        </TableScroll>
    )
}
