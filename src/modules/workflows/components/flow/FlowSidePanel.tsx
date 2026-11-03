import { useDataEngine } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import { Button, IconCross16, NoticeBox } from '@dhis2/ui'
import React, { useState } from 'react'
import { Link } from 'react-router'
import classes from './Flow.module.css'
import { useHandlersQuery } from '@/modules/handlers/hooks/useHandlersQuery'
import {
    describeConnectorTrigger,
    NO_ESCAPE,
} from '@/modules/pipeline-connectors/utils/connectorLabels'
import { describeRule } from '@/modules/pipeline-connectors/utils/connectorRule'
import { describeOutputPath } from '@/modules/pipeline-connectors/utils/stepOutputs'
import { formatDate } from '@/modules/pipeline-detail/utils/formatLabels'
import { useWorkflowMutations } from '@/modules/workflows/hooks/useWorkflows'
import type { WorkflowGraphNode } from '@/modules/workflows/utils/workflowGraph'
import {
    describeWorkflowSchedule,
    formatMergeRule,
} from '@/modules/workflows/utils/workflowLabels'
import { StatusTag } from '@/shared/components/ui/StatusTag'
import tableNavLinkClasses from '@/shared/components/ui/TableNavLink/TableNavLink.module.css'
import type {
    PipelineConnector,
    PipelineMerge,
    WorkflowDetail,
    WorkflowRunDetail,
} from '@/shared/types/caps'

type Props = {
    node: WorkflowGraphNode
    workflow: WorkflowDetail
    latestRun?: WorkflowRunDetail
    onClose: () => void
    onEditMerge: (merge: PipelineMerge) => void
    onDeleteMerge: (merge: PipelineMerge) => void
    onEditConnector: (connector: PipelineConnector) => void
    /** Start a new connector from this pipeline */
    onAddConnector: (pipelineId: string) => void
}

/** Details and actions for the box selected on the diagram. */
export function FlowSidePanel({
    node,
    workflow,
    latestRun,
    onClose,
    onEditMerge,
    onDeleteMerge,
    onEditConnector,
    onAddConnector,
}: Props): React.ReactElement {
    const engine = useDataEngine()
    const { data: handlers = [] } = useHandlersQuery(engine)
    const { removePipelineMutation } = useWorkflowMutations(engine)
    const [error, setError] = useState<string | null>(null)
    const nameOf = (id: string) =>
        workflow.pipelines.find((p) => p.id === id)?.name ?? id

    const header = (caption: string) => (
        <div className={classes.panelHeader}>
            <div>
                <span className={classes.caption}>{caption}</span>
                <h3 className={classes.panelTitle}>{node.label}</h3>
            </div>
            <Button
                small
                secondary
                icon={<IconCross16 />}
                aria-label={i18n.t('Close')}
                onClick={onClose}
            />
        </div>
    )

    if (node.kind === 'start') {
        return (
            <aside className={classes.panel}>
                {header(i18n.t('Start'))}
                <dl className={classes.facts}>
                    <dt>{i18n.t('Schedule')}</dt>
                    <dd>{describeWorkflowSchedule(workflow)}</dd>
                    <dt>{i18n.t('Starts')}</dt>
                    <dd>
                        {workflow.entryPipelineIds.map(nameOf).join(', ') ||
                            '—'}
                    </dd>
                </dl>
                <p className={classes.meta}>
                    {i18n.t(
                        'Each start is one workflow run. The pipelines above start together; connectors and merges start the rest.'
                    )}
                </p>
            </aside>
        )
    }

    if (node.kind === 'external') {
        return (
            <aside className={classes.panel}>
                {header(i18n.t('Outside this workflow'))}
                <p className={classes.meta}>
                    {i18n.t(
                        'A connector in this workflow starts this pipeline, but it is not part of the workflow, so its runs are not counted in workflow runs.'
                    )}
                </p>
                <div className={classes.actions}>
                    <Link
                        to={`/pipelines/${node.refId}`}
                        className={tableNavLinkClasses.link}
                    >
                        {i18n.t('Open pipeline')}
                    </Link>
                </div>
            </aside>
        )
    }

    if (node.kind === 'decision') {
        const connector = workflow.connectors.find((c) => c.id === node.refId)
        if (!connector) {
            return (
                <aside className={classes.panel}>
                    {header(i18n.t('Connector'))}
                </aside>
            )
        }
        const run = latestRun?.connectorRuns
            .filter((r) => r.connectorId === connector.id)
            .at(-1)
        const sourceSteps =
            workflow.pipelines.find((p) => p.id === connector.sourcePipelineId)
                ?.steps ?? []
        return (
            <aside className={classes.panel}>
                {header(i18n.t('Connector'))}
                <dl className={classes.facts}>
                    <dt>{i18n.t('From')}</dt>
                    <dd>{nameOf(connector.sourcePipelineId)}</dd>
                    <dt>{i18n.t('When')}</dt>
                    <dd>{describeConnectorTrigger(connector)}</dd>
                    <dt>{i18n.t('Only if')}</dt>
                    <dd>
                        {describeRule(
                            connector.condition,
                            (path) =>
                                describeOutputPath(path, sourceSteps, handlers)
                                    .label
                        )}
                    </dd>
                    <dt>{i18n.t('Starts')}</dt>
                    <dd>
                        {connector.targetPipeline?.name ??
                            nameOf(connector.targetPipelineId)}
                    </dd>
                    {connector.otherwisePipelineId && (
                        <>
                            <dt>{i18n.t('Otherwise')}</dt>
                            <dd>
                                {connector.otherwisePipeline?.name ??
                                    nameOf(connector.otherwisePipelineId)}
                            </dd>
                        </>
                    )}
                    {run && (
                        <>
                            <dt>{i18n.t('Last run')}</dt>
                            <dd>
                                <StatusTag status={run.status} />
                                {run.startedOtherwise && (
                                    <div>
                                        {i18n.t(
                                            'Condition not met, so the otherwise pipeline started'
                                        )}
                                    </div>
                                )}
                                {!run.startedOtherwise && run.reason && (
                                    <div>{run.reason}</div>
                                )}
                            </dd>
                        </>
                    )}
                </dl>
                <div className={classes.actions}>
                    <Button small onClick={() => onEditConnector(connector)}>
                        {i18n.t('Edit')}
                    </Button>
                    <Link
                        to={`/pipelines/${connector.sourcePipelineId}`}
                        className={tableNavLinkClasses.link}
                    >
                        {i18n.t('Open source pipeline')}
                    </Link>
                </div>
            </aside>
        )
    }

    if (node.kind === 'merge') {
        const merge = workflow.merges.find((m) => m.id === node.refId)
        if (!merge) {
            return (
                <aside className={classes.panel}>
                    {header(i18n.t('Connector · waits for all'))}
                </aside>
            )
        }
        const run = latestRun?.mergeRuns.find((r) => r.merge.id === merge.id)
        const allSteps = merge.sources.flatMap(
            (s) =>
                workflow.pipelines.find((p) => p.id === s.pipelineId)?.steps ??
                []
        )
        return (
            <aside className={classes.panel}>
                {header(i18n.t('Connector · waits for all'))}
                <dl className={classes.facts}>
                    <dt>{i18n.t('Waits for')}</dt>
                    <dd>
                        {merge.sources
                            .map(
                                (s) => s.pipeline?.name ?? nameOf(s.pipelineId)
                            )
                            .join(', ')}
                    </dd>
                    <dt>{i18n.t('Then starts')}</dt>
                    <dd>
                        {merge.targetPipeline?.name ??
                            nameOf(merge.targetPipelineId)}
                    </dd>
                    <dt>{i18n.t('Continues')}</dt>
                    <dd>{formatMergeRule(merge)}</dd>
                    <dt>{i18n.t('Only if')}</dt>
                    <dd>
                        {describeRule(
                            merge.condition,
                            (path) =>
                                describeOutputPath(path, allSteps, handlers)
                                    .label
                        )}
                    </dd>
                    {run && (
                        <>
                            <dt>{i18n.t('Last run')}</dt>
                            <dd>
                                <StatusTag status={run.status} />
                                {run.reason && <div>{run.reason}</div>}
                            </dd>
                        </>
                    )}
                </dl>
                <div className={classes.actions}>
                    <Button small onClick={() => onEditMerge(merge)}>
                        {i18n.t('Edit')}
                    </Button>
                    <Button
                        small
                        destructive
                        onClick={() => onDeleteMerge(merge)}
                    >
                        {i18n.t('Delete')}
                    </Button>
                </div>
            </aside>
        )
    }

    const pipeline = workflow.pipelines.find((p) => p.id === node.refId)
    const execution = latestRun?.executions
        .filter((e) => e.pipeline.id === node.refId)
        .at(-1)
    const starters = [
        ...workflow.connectors
            .filter(
                (c) =>
                    c.targetPipelineId === node.refId ||
                    c.otherwisePipelineId === node.refId
            )
            .map((c) => nameOf(c.sourcePipelineId)),
        ...workflow.merges
            .filter((m) => m.targetPipelineId === node.refId)
            .map((m) =>
                i18n.t('connector “{{name}}”', { name: m.name, ...NO_ESCAPE })
            ),
    ]
    const remove = () => {
        setError(null)
        removePipelineMutation.mutate(
            { id: workflow.id, pipelineId: node.refId! },
            {
                onSuccess: onClose,
                onError: (err) =>
                    setError(
                        err instanceof Error
                            ? err.message
                            : i18n.t('Could not remove the pipeline')
                    ),
            }
        )
    }

    return (
        <aside className={classes.panel}>
            {header(i18n.t('Pipeline'))}
            <dl className={classes.facts}>
                <dt>{i18n.t('Started by')}</dt>
                <dd>
                    {workflow.entryPipelineIds.includes(node.refId!)
                        ? i18n.t('the workflow start')
                        : starters.join(', ')}
                </dd>
                <dt>{i18n.t('Steps')}</dt>
                <dd>{pipeline?._count.steps ?? 0}</dd>
                {pipeline?.isActive === false && (
                    <>
                        <dt>{i18n.t('Status')}</dt>
                        <dd>{i18n.t('Inactive, it will not start')}</dd>
                    </>
                )}
                {latestRun && (
                    <>
                        <dt>{i18n.t('Last run')}</dt>
                        <dd>
                            {execution ? (
                                <>
                                    <StatusTag status={execution.status} />{' '}
                                    <Link
                                        to={`/executions/${execution.id}`}
                                        className={tableNavLinkClasses.link}
                                    >
                                        {formatDate(
                                            execution.startedAt ??
                                                execution.createdAt
                                        )}
                                    </Link>
                                </>
                            ) : (
                                i18n.t('Did not run')
                            )}
                        </dd>
                    </>
                )}
            </dl>
            {error && <NoticeBox error>{error}</NoticeBox>}
            <div className={classes.actions}>
                <Button small onClick={() => onAddConnector(node.refId!)}>
                    {i18n.t('Add connector from here')}
                </Button>
                <Link
                    to={`/pipelines/${node.refId}`}
                    className={tableNavLinkClasses.link}
                >
                    {i18n.t('Open pipeline')}
                </Link>
                <Button
                    small
                    secondary
                    disabled={removePipelineMutation.isPending}
                    onClick={remove}
                >
                    {i18n.t('Remove from workflow')}
                </Button>
            </div>
        </aside>
    )
}
