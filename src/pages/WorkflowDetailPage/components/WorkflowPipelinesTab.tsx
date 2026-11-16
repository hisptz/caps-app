import { useDataEngine } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import {
    Button,
    DataTable,
    DataTableBody,
    DataTableCell,
    DataTableColumnHeader,
    DataTableHead,
    DataTableRow,
    IconAdd16,
    NoticeBox,
    Tag,
} from '@dhis2/ui'
import React, { useState } from 'react'
import { Link } from 'react-router'
import { useHandlersQuery } from '@/modules/handlers/hooks/useHandlersQuery'
import { ConnectorTargets } from '@/modules/pipeline-connectors/components/ConnectorTargets'
import {
    describeConnectorTrigger,
    NO_ESCAPE,
} from '@/modules/pipeline-connectors/utils/connectorLabels'
import { describeRule } from '@/modules/pipeline-connectors/utils/connectorRule'
import { describeOutputPath } from '@/modules/pipeline-connectors/utils/stepOutputs'
import { ActiveTag } from '@/modules/workflows/components/ActiveTag'
import { AddPipelinesPanel } from '@/modules/workflows/components/AddPipelinesPanel'
import pickerClasses from '@/modules/workflows/components/AddPipelinesPanel.module.css'
import {
    ruleLabel,
    whenLabel,
} from '@/modules/workflows/components/WaitForAllConnectorRows'
import workflowClasses from '@/modules/workflows/components/Workflows.module.css'
import { useWorkflowMutations } from '@/modules/workflows/hooks/useWorkflows'
import classes from '@/pages/PipelineDetailPage/PipelineDetailPage.module.css'
import tableNavLinkClasses from '@/shared/components/ui/TableNavLink/TableNavLink.module.css'
import { TableScroll } from '@/shared/components/ui/TableScroll'
import type { WorkflowDetail } from '@/shared/types/caps'

type Props = {
    workflow: WorkflowDetail
}

export function WorkflowPipelinesTab({ workflow }: Props): React.ReactElement {
    const engine = useDataEngine()
    const { removePipelineMutation } = useWorkflowMutations(engine)
    const [showAdd, setShowAdd] = useState(false)
    const [removeError, setRemoveError] = useState<string | null>(null)
    const { data: handlers } = useHandlersQuery(engine)
    const entries = new Set(workflow.entryPipelineIds)
    const memberOf = (pipelineId: string) =>
        workflow.pipelines.find((p) => p.id === pipelineId)
    const stepsOf = (pipelineId: string) =>
        workflow.pipelines.find((p) => p.id === pipelineId)?.steps ?? []

    const remove = (pipelineId: string) => {
        setRemoveError(null)
        removePipelineMutation.mutate(
            { id: workflow.id, pipelineId },
            {
                onError: (err) =>
                    setRemoveError(
                        err instanceof Error
                            ? err.message
                            : i18n.t('Could not remove the pipeline')
                    ),
            }
        )
    }

    return (
        <>
            <div
                className={`${workflowClasses.toolbar} ${pickerClasses.anchor}`}
            >
                <p className={workflowClasses.help}>
                    {i18n.t(
                        'An execution starts the pipelines marked “Starts the execution” together; connectors start the others.'
                    )}
                </p>
                <Button
                    small
                    icon={<IconAdd16 />}
                    toggled={showAdd}
                    aria-expanded={showAdd}
                    onClick={() => setShowAdd((open) => !open)}
                >
                    {i18n.t('Add pipeline')}
                </Button>
                {showAdd && (
                    <AddPipelinesPanel
                        workflowId={workflow.id}
                        className={pickerClasses.underButtonRight}
                        onClose={() => setShowAdd(false)}
                    />
                )}
            </div>

            {removeError && (
                <NoticeBox
                    error
                    title={i18n.t('Could not remove the pipeline')}
                >
                    {removeError}
                </NoticeBox>
            )}

            {workflow.pipelines.length === 0 ? (
                <NoticeBox title={i18n.t('No pipelines yet')}>
                    {i18n.t(
                        'Add the pipelines this workflow runs, then link them with connectors on the Flow tab.'
                    )}
                </NoticeBox>
            ) : (
                <TableScroll label={i18n.t('Workflow pipelines table')}>
                    <DataTable>
                        <DataTableHead>
                            <DataTableRow>
                                <DataTableColumnHeader>
                                    {i18n.t('Pipeline')}
                                </DataTableColumnHeader>
                                <DataTableColumnHeader>
                                    {i18n.t('In an execution')}
                                </DataTableColumnHeader>
                                <DataTableColumnHeader>
                                    {i18n.t('Steps')}
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
                            {workflow.pipelines.map((pipeline) => (
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
                                        {entries.has(pipeline.id) ? (
                                            <Tag positive>
                                                {i18n.t('Starts the execution')}
                                            </Tag>
                                        ) : (
                                            <Tag neutral>
                                                {i18n.t(
                                                    'Started by a connector'
                                                )}
                                            </Tag>
                                        )}
                                    </DataTableCell>
                                    <DataTableCell>
                                        {pipeline._count.steps}
                                    </DataTableCell>
                                    <DataTableCell>
                                        <ActiveTag active={pipeline.isActive} />
                                    </DataTableCell>
                                    <DataTableCell>
                                        <Button
                                            small
                                            secondary
                                            disabled={
                                                removePipelineMutation.isPending
                                            }
                                            onClick={() => remove(pipeline.id)}
                                        >
                                            {i18n.t('Remove')}
                                        </Button>
                                    </DataTableCell>
                                </DataTableRow>
                            ))}
                        </DataTableBody>
                    </DataTable>
                </TableScroll>
            )}

            {workflow.connectors.length + workflow.merges.length > 0 && (
                <>
                    <h3 className={classes.sectionTitle}>
                        {i18n.t('How they connect')}
                    </h3>
                    <p className={workflowClasses.help}>
                        {i18n.t('Add or change connectors on the Flow tab.')}
                    </p>
                    <TableScroll label={i18n.t('Workflow connectors table')}>
                        <DataTable>
                            <DataTableHead>
                                <DataTableRow>
                                    <DataTableColumnHeader>
                                        {i18n.t('When')}
                                    </DataTableColumnHeader>
                                    <DataTableColumnHeader>
                                        {i18n.t('Only if')}
                                    </DataTableColumnHeader>
                                    <DataTableColumnHeader>
                                        {i18n.t('Starts')}
                                    </DataTableColumnHeader>
                                    <DataTableColumnHeader>
                                        {i18n.t('Status')}
                                    </DataTableColumnHeader>
                                </DataTableRow>
                            </DataTableHead>
                            <DataTableBody>
                                {workflow.connectors.map((connector) => (
                                    <DataTableRow key={connector.id}>
                                        <DataTableCell>
                                            {i18n.t('{{pipeline}}: {{when}}', {
                                                nsSeparator: '~~',
                                                pipeline:
                                                    connector.sourcePipeline
                                                        ?.name ??
                                                    connector.sourcePipelineId,
                                                when: describeConnectorTrigger(
                                                    connector
                                                ),
                                                interpolation: NO_ESCAPE,
                                            })}
                                        </DataTableCell>
                                        <DataTableCell>
                                            {describeRule(
                                                connector.condition,
                                                (path) =>
                                                    describeOutputPath(
                                                        path,
                                                        stepsOf(
                                                            connector.sourcePipelineId
                                                        ),
                                                        handlers ?? []
                                                    ).label
                                            )}
                                        </DataTableCell>
                                        <DataTableCell>
                                            <ConnectorTargets
                                                target={{
                                                    id: connector.targetPipelineId,
                                                    name: connector
                                                        .targetPipeline?.name,
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
                                            <ActiveTag
                                                active={connector.isActive}
                                            />
                                        </DataTableCell>
                                    </DataTableRow>
                                ))}
                                {workflow.merges.map((merge) => (
                                    <DataTableRow key={merge.id}>
                                        <DataTableCell>
                                            <div>
                                                {i18n.t(
                                                    '{{pipelines}}: {{when}}',
                                                    {
                                                        nsSeparator: '~~',
                                                        pipelines: merge.sources
                                                            .map(
                                                                (s) =>
                                                                    memberOf(
                                                                        s.pipelineId
                                                                    )?.name ??
                                                                    s.pipelineId
                                                            )
                                                            .join(', '),
                                                        when: whenLabel(merge),
                                                        interpolation:
                                                            NO_ESCAPE,
                                                    }
                                                )}
                                            </div>
                                            <Tag neutral>
                                                {i18n.t('Waits for all')}
                                            </Tag>
                                        </DataTableCell>
                                        <DataTableCell>
                                            {ruleLabel(
                                                merge,
                                                handlers ?? [],
                                                merge.sources.flatMap(
                                                    (s) =>
                                                        memberOf(s.pipelineId)
                                                            ?.steps ?? []
                                                )
                                            )}
                                        </DataTableCell>
                                        <DataTableCell>
                                            <Link
                                                to={`/pipelines/${merge.targetPipelineId}`}
                                                className={
                                                    tableNavLinkClasses.link
                                                }
                                            >
                                                {merge.targetPipeline?.name ??
                                                    merge.targetPipelineId}
                                            </Link>
                                        </DataTableCell>
                                        <DataTableCell>
                                            <ActiveTag
                                                active={merge.isActive}
                                            />
                                        </DataTableCell>
                                    </DataTableRow>
                                ))}
                            </DataTableBody>
                        </DataTable>
                    </TableScroll>
                </>
            )}
        </>
    )
}
