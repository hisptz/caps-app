import { useDataEngine } from '@dhis2/app-runtime'
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
    Modal,
    ModalActions,
    ModalContent,
    ModalTitle,
    NoticeBox,
} from '@dhis2/ui'
import React from 'react'
import { Link } from 'react-router'
import classes from './Workflows.module.css'
import { NO_ESCAPE } from '@/modules/pipeline-connectors/utils/connectorLabels'
import { formatDate } from '@/modules/pipeline-detail/utils/formatLabels'
import { useWorkflowRunQuery } from '@/modules/workflows/hooks/useWorkflows'
import {
    formatRunPeriod,
    formatWorkflowTrigger,
} from '@/modules/workflows/utils/workflowLabels'
import { PageLoader } from '@/shared/components/ui/PageLoader'
import { StatusTag } from '@/shared/components/ui/StatusTag'
import tableNavLinkClasses from '@/shared/components/ui/TableNavLink/TableNavLink.module.css'
import { TableScroll } from '@/shared/components/ui/TableScroll'
import { formatTriggeredBy } from '@/shared/utils/label.utils'

type Props = {
    runId: string
    onClose: () => void
}

/** One workflow run: the pipeline runs it led to, connectors still deciding, and skips. */
export function WorkflowRunModal({
    runId,
    onClose,
}: Props): React.ReactElement {
    const engine = useDataEngine()
    const {
        data: run,
        isLoading,
        isError,
        error,
    } = useWorkflowRunQuery(engine, runId)

    return (
        <Modal large onClose={onClose} position="middle">
            <ModalTitle>{i18n.t('Workflow run')}</ModalTitle>
            <ModalContent>
                {isLoading && <PageLoader variant="content" />}
                {isError && (
                    <NoticeBox error title={i18n.t('Could not load the run')}>
                        {error instanceof Error ? error.message : null}
                    </NoticeBox>
                )}
                {run && (
                    <div className={classes.modalBody}>
                        <div className={classes.meta}>
                            <span>
                                <span className={classes.metaLabel}>
                                    {i18n.t('Status')}
                                </span>
                                <StatusTag status={run.status} />
                            </span>
                            <span>
                                <span className={classes.metaLabel}>
                                    {i18n.t('Started')}
                                </span>
                                {formatDate(run.createdAt)}
                            </span>
                            <span>
                                <span className={classes.metaLabel}>
                                    {i18n.t('Finished')}
                                </span>
                                {formatDate(run.finishedAt)}
                            </span>
                            {run.period && (
                                <span>
                                    <span className={classes.metaLabel}>
                                        {i18n.t('Fixed range')}
                                    </span>
                                    {formatRunPeriod(run.period)}
                                </span>
                            )}
                            <span>
                                <span className={classes.metaLabel}>
                                    {i18n.t('Started by')}
                                </span>
                                {formatWorkflowTrigger(run.triggeredBy)}
                            </span>
                        </div>

                        {run.skipped.length > 0 && (
                            <NoticeBox
                                warning
                                title={i18n.t('Some pipelines did not start')}
                            >
                                <ul>
                                    {run.skipped.map((skip) => (
                                        <li key={skip.pipelineId}>
                                            {i18n.t('{{name}}: {{reason}}', {
                                                nsSeparator: '~~',
                                                name: skip.pipelineName,
                                                reason: skip.reason,
                                                interpolation: NO_ESCAPE,
                                            })}
                                        </li>
                                    ))}
                                </ul>
                            </NoticeBox>
                        )}

                        {run.executions.length > 0 && (
                            <TableScroll label={i18n.t('Pipeline runs table')}>
                                <DataTable>
                                    <DataTableHead>
                                        <DataTableRow>
                                            <DataTableColumnHeader>
                                                {i18n.t('Pipeline')}
                                            </DataTableColumnHeader>
                                            <DataTableColumnHeader>
                                                {i18n.t('Status')}
                                            </DataTableColumnHeader>
                                            <DataTableColumnHeader>
                                                {i18n.t('Started by')}
                                            </DataTableColumnHeader>
                                            <DataTableColumnHeader>
                                                {i18n.t('Started')}
                                            </DataTableColumnHeader>
                                            <DataTableColumnHeader>
                                                {i18n.t('Finished')}
                                            </DataTableColumnHeader>
                                        </DataTableRow>
                                    </DataTableHead>
                                    <DataTableBody>
                                        {run.executions.map((execution) => (
                                            <DataTableRow key={execution.id}>
                                                <DataTableCell>
                                                    <Link
                                                        to={`/executions/${execution.id}`}
                                                        className={
                                                            tableNavLinkClasses.link
                                                        }
                                                        onClick={onClose}
                                                    >
                                                        {
                                                            execution.pipeline
                                                                .name
                                                        }
                                                    </Link>
                                                </DataTableCell>
                                                <DataTableCell>
                                                    <StatusTag
                                                        status={
                                                            execution.status
                                                        }
                                                    />
                                                </DataTableCell>
                                                <DataTableCell>
                                                    {formatTriggeredBy(
                                                        execution.triggeredBy
                                                    )}
                                                </DataTableCell>
                                                <DataTableCell>
                                                    {formatDate(
                                                        execution.startedAt ??
                                                            execution.createdAt
                                                    )}
                                                </DataTableCell>
                                                <DataTableCell>
                                                    {formatDate(
                                                        execution.finishedAt
                                                    )}
                                                </DataTableCell>
                                            </DataTableRow>
                                        ))}
                                    </DataTableBody>
                                </DataTable>
                            </TableScroll>
                        )}

                        {run.waitingConnectorRuns.length > 0 && (
                            <NoticeBox
                                title={i18n.t('Connectors still deciding')}
                            >
                                <ul>
                                    {run.waitingConnectorRuns.map((waiting) => (
                                        <li key={waiting.id}>
                                            {i18n.t(
                                                '“{{connector}}” may start {{target}}; it checks at {{time}}',
                                                {
                                                    connector:
                                                        waiting.connector.name,
                                                    target: waiting.connector
                                                        .targetPipeline.name,
                                                    time: formatDate(
                                                        waiting.checkAt
                                                    ),
                                                    interpolation: NO_ESCAPE,
                                                }
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </NoticeBox>
                        )}
                    </div>
                )}
            </ModalContent>
            <ModalActions>
                <ButtonStrip end>
                    <Button onClick={onClose}>{i18n.t('Close')}</Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    )
}
