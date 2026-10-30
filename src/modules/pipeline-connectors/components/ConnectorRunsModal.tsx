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
    Pagination,
} from '@dhis2/ui'
import React, { useState } from 'react'
import { Link } from 'react-router'
import classes from './ConnectorModal.module.css'
import { CapsApiError } from '@/capsApi/client'
import { paginationToPageCount } from '@/capsApi/types'
import {
    useConnectorMutations,
    useConnectorRunsQuery,
} from '@/modules/pipeline-connectors/hooks/usePipelineConnectors'
import {
    describeConnectorRunTime,
    NO_ESCAPE,
} from '@/modules/pipeline-connectors/utils/connectorLabels'
import { PageLoader } from '@/shared/components/ui/PageLoader'
import { StatusTag } from '@/shared/components/ui/StatusTag'
import tableNavLinkClasses from '@/shared/components/ui/TableNavLink/TableNavLink.module.css'
import { TableScroll } from '@/shared/components/ui/TableScroll'
import type { PipelineConnector } from '@/shared/types/caps'

type Props = {
    connector: PipelineConnector
    onClose: () => void
}

export function ConnectorRunsModal({
    connector,
    onClose,
}: Props): React.ReactElement {
    const engine = useDataEngine()
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [cancelError, setCancelError] = useState<string | null>(null)
    const { data, isLoading, isFetching, refetch } = useConnectorRunsQuery(
        engine,
        connector.id,
        { page, pageSize }
    )
    const { cancelConnectorRunMutation } = useConnectorMutations(engine)
    const runs = data?.items ?? []

    const cancelRun = (connectorRunId: string) => {
        setCancelError(null)
        cancelConnectorRunMutation.mutate(connectorRunId, {
            onError: (err) =>
                setCancelError(
                    err instanceof CapsApiError
                        ? err.message
                        : i18n.t('Could not cancel the run. Try again.')
                ),
        })
    }

    return (
        <Modal large onClose={onClose} position="middle">
            <ModalTitle>
                {i18n.t('History of “{{name}}”', {
                    name: connector.name,
                    ...NO_ESCAPE,
                })}
            </ModalTitle>
            <ModalContent>
                <p className={classes.subtitle}>
                    {i18n.t(
                        'Each time “{{source}}” finishes, this connector checks its rule and then either starts “{{target}}” or skips it. One row per check.',
                        {
                            source: connector.sourcePipeline?.name ?? '',
                            target: connector.targetPipeline?.name ?? '',
                            ...NO_ESCAPE,
                        }
                    )}
                </p>
                {cancelError && (
                    <NoticeBox error title={i18n.t('Could not cancel run')}>
                        {cancelError}
                    </NoticeBox>
                )}
                {isLoading && !data ? (
                    <PageLoader />
                ) : runs.length === 0 ? (
                    <NoticeBox title={i18n.t('No history yet')}>
                        {i18n.t(
                            'Nothing has been checked yet. A row appears here each time “{{source}}” finishes in a way this connector reacts to.',
                            {
                                source: connector.sourcePipeline?.name ?? '',
                                ...NO_ESCAPE,
                            }
                        )}
                    </NoticeBox>
                ) : (
                    <>
                        <TableScroll label={i18n.t('Connector history table')}>
                            <DataTable>
                                <DataTableHead>
                                    <DataTableRow>
                                        <DataTableColumnHeader>
                                            {i18n.t('Result')}
                                        </DataTableColumnHeader>
                                        <DataTableColumnHeader>
                                            {i18n.t('Finished run')}
                                        </DataTableColumnHeader>
                                        <DataTableColumnHeader>
                                            {i18n.t('Run it started')}
                                        </DataTableColumnHeader>
                                        <DataTableColumnHeader>
                                            {i18n.t('Details')}
                                        </DataTableColumnHeader>
                                        <DataTableColumnHeader>
                                            {i18n.t('When')}
                                        </DataTableColumnHeader>
                                        <DataTableColumnHeader>
                                            {i18n.t('Actions')}
                                        </DataTableColumnHeader>
                                    </DataTableRow>
                                </DataTableHead>
                                <DataTableBody>
                                    {runs.map((run) => (
                                        <DataTableRow key={run.id}>
                                            <DataTableCell>
                                                <StatusTag
                                                    status={run.status}
                                                />
                                            </DataTableCell>
                                            <DataTableCell>
                                                <Link
                                                    to={`/executions/${run.sourceExecutionId}`}
                                                    className={
                                                        tableNavLinkClasses.link
                                                    }
                                                    onClick={onClose}
                                                >
                                                    {run.sourceExecutionId.slice(
                                                        0,
                                                        8
                                                    )}
                                                    …
                                                </Link>{' '}
                                                <StatusTag
                                                    status={run.sourceStatus}
                                                />
                                            </DataTableCell>
                                            <DataTableCell>
                                                {run.targetExecution ? (
                                                    <>
                                                        <Link
                                                            to={`/executions/${run.targetExecution.id}`}
                                                            className={
                                                                tableNavLinkClasses.link
                                                            }
                                                            onClick={onClose}
                                                        >
                                                            {run.targetExecution.id.slice(
                                                                0,
                                                                8
                                                            )}
                                                            …
                                                        </Link>{' '}
                                                        <StatusTag
                                                            status={
                                                                run
                                                                    .targetExecution
                                                                    .status
                                                            }
                                                        />
                                                    </>
                                                ) : (
                                                    '—'
                                                )}
                                            </DataTableCell>
                                            <DataTableCell>
                                                {run.startedOtherwise
                                                    ? i18n.t(
                                                          'Condition not met, so the otherwise pipeline started'
                                                      )
                                                    : (run.reason ?? '—')}
                                            </DataTableCell>
                                            <DataTableCell>
                                                {describeConnectorRunTime(run)}
                                            </DataTableCell>
                                            <DataTableCell>
                                                {run.status === 'WAITING' && (
                                                    <Button
                                                        small
                                                        destructive
                                                        disabled={
                                                            cancelConnectorRunMutation.isPending
                                                        }
                                                        onClick={() =>
                                                            cancelRun(run.id)
                                                        }
                                                    >
                                                        {i18n.t('Cancel')}
                                                    </Button>
                                                )}
                                            </DataTableCell>
                                        </DataTableRow>
                                    ))}
                                </DataTableBody>
                            </DataTable>
                        </TableScroll>
                        {data && (
                            <Pagination
                                page={page}
                                pageCount={paginationToPageCount(
                                    data.pagination
                                )}
                                pageSize={pageSize}
                                total={data.pagination.total}
                                onPageChange={setPage}
                                onPageSizeChange={(size: number) => {
                                    setPageSize(size)
                                    setPage(1)
                                }}
                            />
                        )}
                    </>
                )}
            </ModalContent>
            <ModalActions>
                <ButtonStrip end>
                    <Button
                        onClick={() => void refetch()}
                        disabled={isFetching}
                    >
                        {i18n.t('Refresh')}
                    </Button>
                    <Button primary onClick={onClose}>
                        {i18n.t('Close')}
                    </Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    )
}
