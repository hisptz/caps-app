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
import classes from '../ExecutionDetailPage.module.css'
import { ConnectorLastResult } from '@/modules/pipeline-connectors/components/ConnectorLastResult'
import { ConnectorTargets } from '@/modules/pipeline-connectors/components/ConnectorTargets'
import { NO_ESCAPE } from '@/modules/pipeline-connectors/utils/connectorLabels'
import tableNavLinkClasses from '@/shared/components/ui/TableNavLink/TableNavLink.module.css'
import { TableScroll } from '@/shared/components/ui/TableScroll'
import type {
    IncomingConnectorRun,
    OutgoingConnectorRun,
} from '@/shared/types/caps'

type Props = {
    incoming: IncomingConnectorRun | null | undefined
    outgoing: OutgoingConnectorRun[]
}

/** Where this execution came from and what its connectors did when it finished. */
export function ExecutionConnectorsSection({
    incoming,
    outgoing,
}: Props): React.ReactElement | null {
    if (!incoming && outgoing.length === 0) {
        return null
    }

    return (
        <section className={classes.section}>
            <h3>{i18n.t('Connectors')}</h3>
            {incoming && (
                <NoticeBox title={i18n.t('Started by a connector')}>
                    {i18n.t(
                        'The connector “{{connector}}” started this run when a run of “{{pipeline}}” finished.',
                        {
                            connector: incoming.connector.name,
                            pipeline: incoming.sourceExecution.pipeline.name,
                            ...NO_ESCAPE,
                        }
                    )}{' '}
                    <Link
                        to={`/executions/${incoming.sourceExecution.id}`}
                        className={tableNavLinkClasses.link}
                    >
                        {i18n.t('Open that run')}
                    </Link>
                </NoticeBox>
            )}
            {outgoing.length > 0 && (
                <>
                    <p className={classes.sectionHint}>
                        {i18n.t(
                            'What this pipeline’s connectors did when this run finished.'
                        )}
                    </p>
                    <TableScroll label={i18n.t('Connector results table')}>
                        <DataTable>
                            <DataTableHead>
                                <DataTableRow>
                                    <DataTableColumnHeader>
                                        {i18n.t('Connector')}
                                    </DataTableColumnHeader>
                                    <DataTableColumnHeader>
                                        {i18n.t('Starts')}
                                    </DataTableColumnHeader>
                                    <DataTableColumnHeader>
                                        {i18n.t('Result')}
                                    </DataTableColumnHeader>
                                </DataTableRow>
                            </DataTableHead>
                            <DataTableBody>
                                {outgoing.map((run) => (
                                    <DataTableRow key={run.id}>
                                        <DataTableCell>
                                            {run.connector.name}
                                        </DataTableCell>
                                        <DataTableCell>
                                            <ConnectorTargets
                                                target={
                                                    run.connector.targetPipeline
                                                }
                                                otherwise={
                                                    run.connector
                                                        .otherwisePipeline
                                                }
                                            />
                                        </DataTableCell>
                                        <DataTableCell>
                                            <ConnectorLastResult run={run} />
                                        </DataTableCell>
                                    </DataTableRow>
                                ))}
                            </DataTableBody>
                        </DataTable>
                    </TableScroll>
                </>
            )}
        </section>
    )
}
