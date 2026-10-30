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
import classes from '../DashboardPage.module.css'
import { NO_ESCAPE } from '@/modules/pipeline-connectors/utils/connectorLabels'
import { formatDate } from '@/modules/pipeline-detail/utils/formatLabels'
import tableNavLinkClasses from '@/shared/components/ui/TableNavLink/TableNavLink.module.css'
import { TableScroll } from '@/shared/components/ui/TableScroll'
import type { OverdueConnectorRun } from '@/shared/types/caps'

type Props = {
    overdueConnectorRuns: OverdueConnectorRun[]
}

/**
 * Connector runs whose check is more than 10 minutes late: usually the worker is down.
 * Hidden when there are none, so the dashboard stays quiet in the normal case.
 */
export function OverdueConnectorRunsSection({
    overdueConnectorRuns,
}: Props): React.ReactElement | null {
    if (overdueConnectorRuns.length === 0) {
        return null
    }

    return (
        <section className={classes.section}>
            <h3>{i18n.t('Overdue Connectors')}</h3>
            <p className={classes.sectionHint}>
                {i18n.t(
                    'These connectors should have been checked over 10 minutes ago, so the pipelines they start have not started. Check that the CAPS worker is running.'
                )}
            </p>
            <TableScroll label={i18n.t('Overdue connector runs table')}>
                <DataTable>
                    <DataTableHead>
                        <DataTableRow>
                            <DataTableColumnHeader>
                                {i18n.t('Connector')}
                            </DataTableColumnHeader>
                            <DataTableColumnHeader>
                                {i18n.t('From')}
                            </DataTableColumnHeader>
                            <DataTableColumnHeader>
                                {i18n.t('Starts')}
                            </DataTableColumnHeader>
                            <DataTableColumnHeader>
                                {i18n.t('Finished run')}
                            </DataTableColumnHeader>
                            <DataTableColumnHeader>
                                {i18n.t('Should have checked at')}
                            </DataTableColumnHeader>
                        </DataTableRow>
                    </DataTableHead>
                    <DataTableBody>
                        {overdueConnectorRuns.map((run) => (
                            <DataTableRow key={run.id}>
                                <DataTableCell>
                                    {run.connector.name}
                                </DataTableCell>
                                <DataTableCell>
                                    {run.connector.sourcePipeline.name}
                                </DataTableCell>
                                <DataTableCell>
                                    {run.connector.otherwisePipeline
                                        ? i18n.t(
                                              '{{target}} or {{otherwise}}',
                                              {
                                                  target: run.connector
                                                      .targetPipeline.name,
                                                  otherwise:
                                                      run.connector
                                                          .otherwisePipeline
                                                          .name,
                                                  ...NO_ESCAPE,
                                              }
                                          )
                                        : run.connector.targetPipeline.name}
                                </DataTableCell>
                                <DataTableCell>
                                    <Link
                                        to={`/executions/${run.sourceExecutionId}`}
                                        className={tableNavLinkClasses.link}
                                    >
                                        {run.sourceExecutionId.slice(0, 8)}…
                                    </Link>
                                </DataTableCell>
                                <DataTableCell>
                                    {formatDate(run.checkAt)}
                                </DataTableCell>
                            </DataTableRow>
                        ))}
                    </DataTableBody>
                </DataTable>
            </TableScroll>
        </section>
    )
}
