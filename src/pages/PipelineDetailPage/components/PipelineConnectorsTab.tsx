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
    IconAdd16,
    IconBlock16,
    IconClockHistory16,
    IconDelete16,
    IconEdit16,
    IconLaunch16,
    NoticeBox,
} from '@dhis2/ui'
import React, { useState } from 'react'
import { Link } from 'react-router'
import classes from '../PipelineDetailPage.module.css'
import { CapsApiError } from '@/capsApi/client'
import { useHandlersQuery } from '@/modules/handlers/hooks/useHandlersQuery'
import { ConnectorLastResult } from '@/modules/pipeline-connectors/components/ConnectorLastResult'
import { ConnectorModal } from '@/modules/pipeline-connectors/components/ConnectorModal'
import { ConnectorRunsModal } from '@/modules/pipeline-connectors/components/ConnectorRunsModal'
import { ConnectorTargets } from '@/modules/pipeline-connectors/components/ConnectorTargets'
import { DeleteConnectorModal } from '@/modules/pipeline-connectors/components/DeleteConnectorModal'
import {
    useConnectorMutations,
    usePipelineConnectorsQuery,
} from '@/modules/pipeline-connectors/hooks/usePipelineConnectors'
import {
    connectorFormValuesToCreateBody,
    connectorFormValuesToUpdateBody,
    type ConnectorFormValues,
} from '@/modules/pipeline-connectors/schemas/connectorFormSchema'
import {
    describeConnectorTrigger,
    NO_ESCAPE,
} from '@/modules/pipeline-connectors/utils/connectorLabels'
import { describeRule } from '@/modules/pipeline-connectors/utils/connectorRule'
import { describeOutputPath } from '@/modules/pipeline-connectors/utils/stepOutputs'
import { PageLoader } from '@/shared/components/ui/PageLoader'
import { StatusTag } from '@/shared/components/ui/StatusTag'
import tableNavLinkClasses from '@/shared/components/ui/TableNavLink/TableNavLink.module.css'
import { TableScroll } from '@/shared/components/ui/TableScroll'
import type { PipelineConnector, PipelineStep } from '@/shared/types/caps'

type Props = {
    pipeline: { id: string; name: string }
    /** In step order; rule summaries and conditions refer to them */
    steps: PipelineStep[]
}

const errorMessage = (err: unknown, fallback: string) =>
    err instanceof CapsApiError ? err.message : fallback

export function PipelineConnectorsTab({
    pipeline,
    steps,
}: Props): React.ReactElement {
    const engine = useDataEngine()
    const { data: handlers } = useHandlersQuery(engine)
    const labelPath = (path: string) =>
        describeOutputPath(path, steps, handlers ?? []).label
    const { data, isLoading, isError, error } = usePipelineConnectorsQuery(
        engine,
        pipeline.id,
        true
    )
    const {
        createConnectorMutation,
        updateConnectorMutation,
        deleteConnectorMutation,
    } = useConnectorMutations(engine)

    const [editing, setEditing] = useState<PipelineConnector | null>(null)
    const [showCreate, setShowCreate] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<PipelineConnector | null>(
        null
    )
    const [deleteError, setDeleteError] = useState<string | null>(null)
    const [runsTarget, setRunsTarget] = useState<PipelineConnector | null>(null)
    const [actionError, setActionError] = useState<string | null>(null)

    const outgoing = data?.outgoing ?? []
    const incoming = data?.incoming ?? []

    const saveConnector = (values: ConnectorFormValues) =>
        editing
            ? updateConnectorMutation.mutateAsync({
                  connectorId: editing.id,
                  body: connectorFormValuesToUpdateBody(values),
              })
            : createConnectorMutation.mutateAsync(
                  connectorFormValuesToCreateBody(values, pipeline.id)
              )

    const toggleActive = (connector: PipelineConnector) => {
        setActionError(null)
        updateConnectorMutation.mutate(
            {
                connectorId: connector.id,
                body: { isActive: !connector.isActive },
            },
            {
                onError: (err) =>
                    setActionError(
                        errorMessage(
                            err,
                            i18n.t('Could not update the connector. Try again.')
                        )
                    ),
            }
        )
    }

    if (isLoading && !data) {
        return <PageLoader />
    }

    return (
        <>
            <div className={classes.tabActions}>
                <Button
                    icon={<IconAdd16 />}
                    onClick={() => setShowCreate(true)}
                >
                    {i18n.t('Add connector')}
                </Button>
            </div>
            {isError && (
                <NoticeBox error title={i18n.t('Could not load connectors')}>
                    {errorMessage(error, i18n.t('Try again later.'))}
                </NoticeBox>
            )}
            {actionError && (
                <NoticeBox error title={i18n.t('Connector action failed')}>
                    {actionError}
                </NoticeBox>
            )}

            <h3 className={classes.sectionTitle}>
                {i18n.t('Pipelines this one starts')}
            </h3>
            {outgoing.length === 0 ? (
                <NoticeBox title={i18n.t('No connectors yet')}>
                    {i18n.t(
                        'Add a connector to start another pipeline automatically when this one finishes. A rule can limit it to certain results.'
                    )}
                </NoticeBox>
            ) : (
                <TableScroll label={i18n.t('Outgoing connectors table')}>
                    <DataTable>
                        <DataTableHead>
                            <DataTableRow>
                                <DataTableColumnHeader>
                                    {i18n.t('Name')}
                                </DataTableColumnHeader>
                                <DataTableColumnHeader>
                                    {i18n.t('Starts')}
                                </DataTableColumnHeader>
                                <DataTableColumnHeader>
                                    {i18n.t('When')}
                                </DataTableColumnHeader>
                                <DataTableColumnHeader>
                                    {i18n.t('Only if')}
                                </DataTableColumnHeader>
                                <DataTableColumnHeader>
                                    {i18n.t('Last result')}
                                </DataTableColumnHeader>
                                <DataTableColumnHeader>
                                    {i18n.t('Status')}
                                </DataTableColumnHeader>
                                <DataTableColumnHeader>
                                    {i18n.t('Actions')}
                                </DataTableColumnHeader>
                            </DataTableRow>
                        </DataTableHead>
                        <DataTableBody>
                            {outgoing.map((connector) => (
                                <DataTableRow key={connector.id}>
                                    <DataTableCell>
                                        {connector.name}
                                    </DataTableCell>
                                    <DataTableCell>
                                        <ConnectorTargets
                                            target={{
                                                id: connector.targetPipelineId,
                                                name: connector.targetPipeline
                                                    ?.name,
                                            }}
                                            otherwise={
                                                connector.otherwisePipelineId
                                                    ? {
                                                          id: connector.otherwisePipelineId,
                                                          name: connector
                                                              .otherwisePipeline
                                                              ?.name,
                                                      }
                                                    : null
                                            }
                                        />
                                    </DataTableCell>
                                    <DataTableCell>
                                        {describeConnectorTrigger(connector)}
                                    </DataTableCell>
                                    <DataTableCell>
                                        {describeRule(
                                            connector.condition,
                                            labelPath
                                        )}
                                    </DataTableCell>
                                    <DataTableCell>
                                        <ConnectorLastResult
                                            run={connector.runs?.[0]}
                                        />
                                    </DataTableCell>
                                    <DataTableCell>
                                        <StatusTag
                                            status={
                                                connector.isActive
                                                    ? 'ACTIVE'
                                                    : 'INACTIVE'
                                            }
                                        />
                                    </DataTableCell>
                                    <DataTableCell>
                                        <ButtonStrip>
                                            <Button
                                                small
                                                icon={<IconEdit16 />}
                                                aria-label={i18n.t(
                                                    'Edit connector'
                                                )}
                                                onClick={() =>
                                                    setEditing(connector)
                                                }
                                            />
                                            <Button
                                                small
                                                icon={<IconClockHistory16 />}
                                                aria-label={i18n.t(
                                                    'View history'
                                                )}
                                                onClick={() =>
                                                    setRunsTarget(connector)
                                                }
                                            />
                                            <Button
                                                small
                                                icon={
                                                    connector.isActive ? (
                                                        <IconBlock16 />
                                                    ) : (
                                                        <IconLaunch16 />
                                                    )
                                                }
                                                aria-label={
                                                    connector.isActive
                                                        ? i18n.t(
                                                              'Deactivate connector'
                                                          )
                                                        : i18n.t(
                                                              'Activate connector'
                                                          )
                                                }
                                                disabled={
                                                    updateConnectorMutation.isPending
                                                }
                                                onClick={() =>
                                                    toggleActive(connector)
                                                }
                                            />
                                            <Button
                                                small
                                                destructive
                                                icon={<IconDelete16 />}
                                                aria-label={i18n.t(
                                                    'Delete connector'
                                                )}
                                                onClick={() => {
                                                    setDeleteTarget(connector)
                                                    setDeleteError(null)
                                                }}
                                            />
                                        </ButtonStrip>
                                    </DataTableCell>
                                </DataTableRow>
                            ))}
                        </DataTableBody>
                    </DataTable>
                </TableScroll>
            )}

            {incoming.length > 0 && (
                <>
                    <h3 className={classes.sectionTitle}>
                        {i18n.t('Pipelines that start this one')}
                    </h3>
                    <p className={classes.description}>
                        {i18n.t(
                            'These connectors belong to other pipelines. Open that pipeline to change them.'
                        )}
                    </p>
                    <TableScroll label={i18n.t('Incoming connectors table')}>
                        <DataTable>
                            <DataTableHead>
                                <DataTableRow>
                                    <DataTableColumnHeader>
                                        {i18n.t('Name')}
                                    </DataTableColumnHeader>
                                    <DataTableColumnHeader>
                                        {i18n.t('From')}
                                    </DataTableColumnHeader>
                                    <DataTableColumnHeader>
                                        {i18n.t('When')}
                                    </DataTableColumnHeader>
                                    <DataTableColumnHeader>
                                        {i18n.t('Only if')}
                                    </DataTableColumnHeader>
                                    <DataTableColumnHeader>
                                        {i18n.t('Status')}
                                    </DataTableColumnHeader>
                                </DataTableRow>
                            </DataTableHead>
                            <DataTableBody>
                                {incoming.map((connector) => (
                                    <DataTableRow key={connector.id}>
                                        <DataTableCell>
                                            {connector.name}
                                        </DataTableCell>
                                        <DataTableCell>
                                            <Link
                                                to={`/pipelines/${connector.sourcePipelineId}`}
                                                className={
                                                    tableNavLinkClasses.link
                                                }
                                            >
                                                {connector.sourcePipeline
                                                    ?.name ??
                                                    connector.sourcePipelineId}
                                            </Link>
                                        </DataTableCell>
                                        <DataTableCell>
                                            {describeConnectorTrigger(
                                                connector
                                            )}
                                        </DataTableCell>
                                        <DataTableCell>
                                            {connector.otherwisePipelineId ===
                                            pipeline.id
                                                ? i18n.t(
                                                      'Otherwise, if not ({{rule}})',
                                                      {
                                                          rule: describeRule(
                                                              connector.condition
                                                          ),
                                                          ...NO_ESCAPE,
                                                      }
                                                  )
                                                : describeRule(
                                                      connector.condition
                                                  )}
                                        </DataTableCell>
                                        <DataTableCell>
                                            <StatusTag
                                                status={
                                                    connector.isActive
                                                        ? 'ACTIVE'
                                                        : 'INACTIVE'
                                                }
                                            />
                                        </DataTableCell>
                                    </DataTableRow>
                                ))}
                            </DataTableBody>
                        </DataTable>
                    </TableScroll>
                </>
            )}

            <ConnectorModal
                open={showCreate || editing !== null}
                onClose={() => {
                    setShowCreate(false)
                    setEditing(null)
                }}
                sourcePipeline={pipeline}
                sourceSteps={steps}
                connector={editing}
                isPending={
                    createConnectorMutation.isPending ||
                    updateConnectorMutation.isPending
                }
                onSubmit={saveConnector}
            />

            {deleteTarget && (
                <DeleteConnectorModal
                    connector={deleteTarget}
                    error={deleteError}
                    isPending={deleteConnectorMutation.isPending}
                    onClose={() => setDeleteTarget(null)}
                    onConfirm={() =>
                        deleteConnectorMutation.mutate(deleteTarget.id, {
                            onSuccess: () => setDeleteTarget(null),
                            onError: (err) =>
                                setDeleteError(
                                    errorMessage(
                                        err,
                                        i18n.t(
                                            'Could not delete the connector. Try again.'
                                        )
                                    )
                                ),
                        })
                    }
                />
            )}

            {runsTarget && (
                <ConnectorRunsModal
                    connector={runsTarget}
                    onClose={() => setRunsTarget(null)}
                />
            )}
        </>
    )
}
