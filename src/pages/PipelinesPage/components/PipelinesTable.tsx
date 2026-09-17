import i18n from '@dhis2/d2-i18n'
import {
    DataTable,
    DataTableBody,
    DataTableCell,
    DataTableColumnHeader,
    DataTableHead,
    DataTableRow,
    Tag,
} from '@dhis2/ui'
import React from 'react'
import { Link } from 'react-router'
import { PipelineTableActions } from '@/modules/pipelines/components/PipelineTableActions'
import tableNavLinkClasses from '@/shared/components/ui/TableNavLink/TableNavLink.module.css'
import { TableScroll } from '@/shared/components/ui/TableScroll'
import type { Pipeline } from '@/shared/types/caps'
import { formatConcurrencyPolicy } from '@/shared/utils/label.utils'

type Props = {
    pipelines: Pipeline[]
}

export function PipelinesTable({ pipelines }: Props): React.ReactElement {
    return (
        <TableScroll label={i18n.t('Pipelines table')}>
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
                            {i18n.t('Concurrency')}
                        </DataTableColumnHeader>
                        <DataTableColumnHeader>
                            {i18n.t('Steps')}
                        </DataTableColumnHeader>
                        <DataTableColumnHeader>
                            {i18n.t('Schedules')}
                        </DataTableColumnHeader>
                        <DataTableColumnHeader>
                            {i18n.t('Actions')}
                        </DataTableColumnHeader>
                    </DataTableRow>
                </DataTableHead>
                <DataTableBody>
                    {pipelines.map((pipeline) => (
                        <DataTableRow key={pipeline.id}>
                            <DataTableCell>
                                <Link
                                    to={`/pipelines/${pipeline.id}`}
                                    className={tableNavLinkClasses.link}
                                >
                                    {pipeline.name}
                                </Link>
                            </DataTableCell>
                            <DataTableCell>
                                {pipeline.isActive ? (
                                    <Tag positive>{i18n.t('Active')}</Tag>
                                ) : (
                                    <Tag neutral>{i18n.t('Inactive')}</Tag>
                                )}
                            </DataTableCell>
                            <DataTableCell>
                                {formatConcurrencyPolicy(
                                    pipeline.concurrencyPolicy
                                )}
                            </DataTableCell>
                            <DataTableCell>
                                {pipeline._count.steps}
                            </DataTableCell>
                            <DataTableCell>
                                {pipeline._count.schedules}
                            </DataTableCell>
                            <DataTableCell>
                                <PipelineTableActions pipeline={pipeline} />
                            </DataTableCell>
                        </DataTableRow>
                    ))}
                </DataTableBody>
            </DataTable>
        </TableScroll>
    )
}
