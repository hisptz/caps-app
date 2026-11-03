import i18n from '@dhis2/d2-i18n'
import { DataTableCell, DataTableRow, Tag } from '@dhis2/ui'
import React from 'react'
import { Link } from 'react-router'
import type { HandlerDescriptor } from '@/capsApi/types'
import { NO_ESCAPE } from '@/modules/pipeline-connectors/utils/connectorLabels'
import { describeRule } from '@/modules/pipeline-connectors/utils/connectorRule'
import { describeOutputPath } from '@/modules/pipeline-connectors/utils/stepOutputs'
import { ActiveTag } from '@/modules/workflows/components/ActiveTag'
import { StatusTag } from '@/shared/components/ui/StatusTag'
import tableNavLinkClasses from '@/shared/components/ui/TableNavLink/TableNavLink.module.css'
import type { PipelineMerge, PipelineStep } from '@/shared/types/caps'

// ============================================================
// Connectors that wait for several pipelines ("merges" in the engine), as extra rows in a
// pipeline's connector tables. They belong to a workflow and are edited on its diagram.
// ============================================================

function sourceNames(merge: PipelineMerge, exceptId?: string): string {
    return merge.sources
        .filter((s) => s.pipelineId !== exceptId)
        .map((s) => s.pipeline?.name ?? s.pipelineId)
        .join(', ')
}

export function whenLabel(merge: PipelineMerge): string {
    const hours = Math.round(merge.timeoutMinutes / 60)
    return merge.triggerRule === 'ALL_DONE'
        ? i18n.t('When all have finished (up to {{hours}} h)', { hours })
        : i18n.t('When all succeed (up to {{hours}} h)', { hours })
}

/** `steps`: the source pipelines' steps when the merge itself does not carry them */
export function ruleLabel(
    merge: PipelineMerge,
    handlers: HandlerDescriptor[],
    steps: PipelineStep[] = merge.sources.flatMap(
        (s) => s.pipeline?.steps ?? []
    )
): string {
    return describeRule(
        merge.condition,
        (path) => describeOutputPath(path, steps, handlers).label
    )
}

function NameCell({ merge }: { merge: PipelineMerge }): React.ReactElement {
    return (
        <DataTableCell>
            <div>{merge.name}</div>
            <Tag neutral>{i18n.t('Waits for all')}</Tag>
        </DataTableCell>
    )
}

function WorkflowLink({
    merge,
}: {
    merge: PipelineMerge
}): React.ReactElement | null {
    return merge.workflow ? (
        <Link
            to={`/workflows/${merge.workflow.id}`}
            className={tableNavLinkClasses.link}
        >
            {i18n.t('Edit in workflow')}
        </Link>
    ) : null
}

/** Rows for "Pipelines this one starts": connectors that wait for this pipeline and others. */
export function OutgoingWaitForAllRows({
    merges,
    pipelineId,
    handlers,
}: {
    merges: PipelineMerge[]
    pipelineId: string
    handlers: HandlerDescriptor[]
}): React.ReactElement {
    return (
        <>
            {merges.map((merge) => (
                <DataTableRow key={merge.id}>
                    <NameCell merge={merge} />
                    <DataTableCell>
                        <Link
                            to={`/pipelines/${merge.targetPipelineId}`}
                            className={tableNavLinkClasses.link}
                        >
                            {merge.targetPipeline?.name ??
                                merge.targetPipelineId}
                        </Link>
                        <div>
                            {i18n.t('together with {{others}}', {
                                others: sourceNames(merge, pipelineId),
                                interpolation: NO_ESCAPE,
                            })}
                        </div>
                    </DataTableCell>
                    <DataTableCell>{whenLabel(merge)}</DataTableCell>
                    <DataTableCell>{ruleLabel(merge, handlers)}</DataTableCell>
                    <DataTableCell>
                        {merge.runs?.[0] ? (
                            <StatusTag status={merge.runs[0].status} />
                        ) : (
                            i18n.t('Not checked yet')
                        )}
                    </DataTableCell>
                    <DataTableCell>
                        <ActiveTag active={merge.isActive} />
                    </DataTableCell>
                    <DataTableCell>
                        <WorkflowLink merge={merge} />
                    </DataTableCell>
                </DataTableRow>
            ))}
        </>
    )
}

/** Rows for "Pipelines that start this one": connectors that start it once all their pipelines are done. */
export function IncomingWaitForAllRows({
    merges,
    handlers,
}: {
    merges: PipelineMerge[]
    handlers: HandlerDescriptor[]
}): React.ReactElement {
    return (
        <>
            {merges.map((merge) => (
                <DataTableRow key={merge.id}>
                    <NameCell merge={merge} />
                    <DataTableCell>
                        {sourceNames(merge)}
                        <div>
                            <WorkflowLink merge={merge} />
                        </div>
                    </DataTableCell>
                    <DataTableCell>{whenLabel(merge)}</DataTableCell>
                    <DataTableCell>{ruleLabel(merge, handlers)}</DataTableCell>
                    <DataTableCell>
                        <ActiveTag active={merge.isActive} />
                    </DataTableCell>
                </DataTableRow>
            ))}
        </>
    )
}
