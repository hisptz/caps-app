import { useDataEngine } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import {
    Button,
    ButtonStrip,
    IconAdd16,
    Modal,
    ModalActions,
    ModalContent,
    ModalTitle,
    SingleSelectField,
    SingleSelectOption,
} from '@dhis2/ui'
import { useQueryClient } from '@tanstack/react-query'
import React, { useState } from 'react'
import { capsKeys } from '@/capsApi/queryKeys'
import { ConnectorModal } from '@/modules/pipeline-connectors/components/ConnectorModal'
import { ConnectorRunsModal } from '@/modules/pipeline-connectors/components/ConnectorRunsModal'
import { DeleteConnectorModal } from '@/modules/pipeline-connectors/components/DeleteConnectorModal'
import { useConnectorMutations } from '@/modules/pipeline-connectors/hooks/usePipelineConnectors'
import {
    connectorFormValuesToCreateBody,
    connectorFormValuesToUpdateBody,
    type ConnectorFormValues,
} from '@/modules/pipeline-connectors/schemas/connectorFormSchema'
import { AddPipelinesPanel } from '@/modules/workflows/components/AddPipelinesPanel'
import pickerClasses from '@/modules/workflows/components/AddPipelinesPanel.module.css'
import { DeleteMergeModal } from '@/modules/workflows/components/DeleteMergeModal'
import flowClasses from '@/modules/workflows/components/flow/Flow.module.css'
import { FlowSidePanel } from '@/modules/workflows/components/flow/FlowSidePanel'
import { WorkflowFlow } from '@/modules/workflows/components/flow/WorkflowFlow'
import { MergeModal } from '@/modules/workflows/components/MergeModal'
import {
    useMergeMutations,
    useWorkflowRunQuery,
    useWorkflowRunsQuery,
} from '@/modules/workflows/hooks/useWorkflows'
import type { WorkflowGraphNode } from '@/modules/workflows/utils/workflowGraph'
import type {
    PipelineConnector,
    PipelineMerge,
    WorkflowDetail,
} from '@/shared/types/caps'

type Props = {
    workflow: WorkflowDetail
}

type ConnectorEditor =
    | { step: 'closed' }
    | { step: 'source' }
    | { step: 'form'; sourceId: string; connector: PipelineConnector | null }

/** Ask which pipeline a new connector starts from. */
function ChooseSourceModal({
    workflow,
    onClose,
    onNext,
}: {
    workflow: WorkflowDetail
    onClose: () => void
    onNext: (pipelineId: string) => void
}): React.ReactElement {
    const [selected, setSelected] = useState<string | undefined>()
    return (
        <Modal onClose={onClose} position="middle">
            <ModalTitle>{i18n.t('New connector')}</ModalTitle>
            <ModalContent>
                <SingleSelectField
                    label={i18n.t('When this pipeline finishes')}
                    selected={selected}
                    onChange={({ selected: next }) => setSelected(next)}
                >
                    {workflow.pipelines.map((p) => (
                        <SingleSelectOption
                            key={p.id}
                            value={p.id}
                            label={p.name}
                        />
                    ))}
                </SingleSelectField>
            </ModalContent>
            <ModalActions>
                <ButtonStrip end>
                    <Button onClick={onClose}>{i18n.t('Cancel')}</Button>
                    <Button
                        primary
                        disabled={!selected}
                        onClick={() => selected && onNext(selected)}
                    >
                        {i18n.t('Next')}
                    </Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    )
}

/** The workflow as a diagram, coloured by its latest run, with a panel for the selected box. */
export function WorkflowFlowTab({ workflow }: Props): React.ReactElement {
    const engine = useDataEngine()
    const queryClient = useQueryClient()
    const [selected, setSelected] = useState<WorkflowGraphNode | null>(null)
    const [showAddPipeline, setShowAddPipeline] = useState(false)
    const [mergeModal, setMergeModal] = useState<{
        open: boolean
        merge: PipelineMerge | null
    }>({ open: false, merge: null })
    const [connectorEditor, setConnectorEditor] = useState<ConnectorEditor>({
        step: 'closed',
    })
    const [deleting, setDeleting] = useState<PipelineMerge | null>(null)
    const [deleteError, setDeleteError] = useState<string | null>(null)
    const { deleteMergeMutation } = useMergeMutations(engine)
    const {
        createConnectorMutation,
        updateConnectorMutation,
        deleteConnectorMutation,
    } = useConnectorMutations(engine)
    const [deletingConnector, setDeletingConnector] =
        useState<PipelineConnector | null>(null)
    const [connectorRuns, setConnectorRuns] =
        useState<PipelineConnector | null>(null)

    const { data: runs } = useWorkflowRunsQuery(engine, workflow.id, {
        page: 1,
        pageSize: 1,
    })
    const { data: latestRun } = useWorkflowRunQuery(engine, runs?.items[0]?.id)

    // Keep the selection only while its box still exists (e.g. after a delete)
    const selectedNode =
        selected &&
        (selected.kind === 'start' ||
            selected.kind === 'external' ||
            (selected.kind === 'pipeline' &&
                workflow.pipelines.some((p) => p.id === selected.refId)) ||
            (selected.kind === 'merge' &&
                workflow.merges.some((m) => m.id === selected.refId)) ||
            (selected.kind === 'decision' &&
                workflow.connectors.some((c) => c.id === selected.refId)))
            ? selected
            : null

    const editorSource =
        connectorEditor.step === 'form'
            ? workflow.pipelines.find((p) => p.id === connectorEditor.sourceId)
            : undefined

    const saveConnector = async (values: ConnectorFormValues) => {
        if (connectorEditor.step !== 'form') {
            return
        }
        const saved = connectorEditor.connector
            ? await updateConnectorMutation.mutateAsync({
                  connectorId: connectorEditor.connector.id,
                  body: connectorFormValuesToUpdateBody(values),
              })
            : await createConnectorMutation.mutateAsync(
                  connectorFormValuesToCreateBody(
                      values,
                      connectorEditor.sourceId
                  )
              )
        // The workflow lists its connectors; refresh the diagram
        await queryClient.invalidateQueries({
            queryKey: capsKeys.workflows.all(),
        })
        return saved
    }

    const confirmDelete = () => {
        if (!deleting) {
            return
        }
        setDeleteError(null)
        deleteMergeMutation.mutate(deleting.id, {
            onSuccess: () => {
                setDeleting(null)
                setSelected(null)
            },
            onError: (err) =>
                setDeleteError(
                    err instanceof Error
                        ? err.message
                        : i18n.t('Could not delete the connector')
                ),
        })
    }

    const confirmDeleteConnector = () => {
        if (!deletingConnector) {
            return
        }
        setDeleteError(null)
        deleteConnectorMutation.mutate(deletingConnector.id, {
            onSuccess: async () => {
                setDeletingConnector(null)
                setSelected(null)
                // The workflow lists its connectors; refresh the diagram
                await queryClient.invalidateQueries({
                    queryKey: capsKeys.workflows.all(),
                })
            },
            onError: (err) =>
                setDeleteError(
                    err instanceof Error
                        ? err.message
                        : i18n.t('Could not delete the connector')
                ),
        })
    }

    // A connector can start any other pipeline, even one outside the workflow
    const canConnect = workflow.pipelines.length >= 1

    return (
        <>
            <WorkflowFlow
                workflow={workflow}
                latestRun={latestRun}
                selectedNodeId={selectedNode?.id ?? null}
                onSelect={setSelected}
                overlay={
                    showAddPipeline && (
                        <AddPipelinesPanel
                            workflowId={workflow.id}
                            className={pickerClasses.underFlowToolbar}
                            onClose={() => setShowAddPipeline(false)}
                        />
                    )
                }
                emptyState={
                    <div
                        className={[
                            flowClasses.emptyInner,
                            showAddPipeline ? flowClasses.dimmed : '',
                        ]
                            .filter(Boolean)
                            .join(' ')}
                    >
                        <svg
                            width="56"
                            height="56"
                            viewBox="0 0 56 56"
                            aria-hidden="true"
                            fill="none"
                            stroke="#8a95a3"
                            strokeWidth="1.6"
                        >
                            <rect
                                x="2"
                                y="21"
                                width="16"
                                height="14"
                                rx="2"
                                strokeDasharray="4 3"
                            />
                            <rect
                                x="38"
                                y="21"
                                width="16"
                                height="14"
                                rx="2"
                                strokeDasharray="4 3"
                            />
                            <path d="M20 28h16" strokeDasharray="4 3" />
                            <path d="M33 24.5l3.5 3.5-3.5 3.5" />
                        </svg>
                        <h2 className={flowClasses.emptyTitle}>
                            {i18n.t('This workflow has no pipelines yet')}
                        </h2>
                        {!showAddPipeline && (
                            <>
                                <p className={flowClasses.emptyText}>
                                    {i18n.t(
                                        'Add the pipelines this workflow should run, then draw a connector between them to set what waits for what.'
                                    )}
                                </p>
                                <Button
                                    primary
                                    icon={<IconAdd16 />}
                                    onClick={() => setShowAddPipeline(true)}
                                >
                                    {i18n.t('Add pipeline')}
                                </Button>
                            </>
                        )}
                    </div>
                }
                toolbar={
                    <>
                        <Button
                            small
                            icon={<IconAdd16 />}
                            toggled={showAddPipeline}
                            aria-expanded={showAddPipeline}
                            onClick={() => {
                                setSelected(null)
                                setShowAddPipeline((open) => !open)
                            }}
                        >
                            {i18n.t('Add pipeline')}
                        </Button>
                        <span
                            title={
                                canConnect
                                    ? undefined
                                    : i18n.t('Add a pipeline first')
                            }
                        >
                            <Button
                                small
                                icon={<IconAdd16 />}
                                disabled={!canConnect}
                                onClick={() => {
                                    setSelected(null)
                                    setShowAddPipeline(false)
                                    setConnectorEditor({ step: 'source' })
                                }}
                            >
                                {i18n.t('Add connector')}
                            </Button>
                        </span>
                    </>
                }
                panel={
                    selectedNode && (
                        <FlowSidePanel
                            node={selectedNode}
                            workflow={workflow}
                            latestRun={latestRun}
                            onClose={() => setSelected(null)}
                            onEditMerge={(merge) =>
                                setMergeModal({ open: true, merge })
                            }
                            onDeleteMerge={(merge) => {
                                setDeleteError(null)
                                setDeleting(merge)
                            }}
                            onEditConnector={(connector) =>
                                setConnectorEditor({
                                    step: 'form',
                                    sourceId: connector.sourcePipelineId,
                                    connector,
                                })
                            }
                            onDeleteConnector={(connector) => {
                                setDeleteError(null)
                                setDeletingConnector(connector)
                            }}
                            onShowConnectorRuns={setConnectorRuns}
                            onAddConnector={(pipelineId) =>
                                setConnectorEditor({
                                    step: 'form',
                                    sourceId: pipelineId,
                                    connector: null,
                                })
                            }
                        />
                    )
                }
            />

            <MergeModal
                open={mergeModal.open}
                workflow={workflow}
                merge={mergeModal.merge}
                onClose={() => setMergeModal({ open: false, merge: null })}
            />
            {connectorEditor.step === 'source' && (
                <ChooseSourceModal
                    workflow={workflow}
                    onClose={() => setConnectorEditor({ step: 'closed' })}
                    onNext={(sourceId) =>
                        setConnectorEditor({
                            step: 'form',
                            sourceId,
                            connector: null,
                        })
                    }
                />
            )}
            {editorSource && connectorEditor.step === 'form' && (
                <ConnectorModal
                    open
                    onClose={() => setConnectorEditor({ step: 'closed' })}
                    sourcePipeline={editorSource}
                    sourceSteps={editorSource.steps}
                    connector={connectorEditor.connector}
                    existingConnectors={workflow.connectors}
                    isPending={
                        createConnectorMutation.isPending ||
                        updateConnectorMutation.isPending
                    }
                    onSubmit={saveConnector}
                />
            )}
            {deletingConnector && (
                <DeleteConnectorModal
                    connector={deletingConnector}
                    error={deleteError}
                    isPending={deleteConnectorMutation.isPending}
                    onClose={() => setDeletingConnector(null)}
                    onConfirm={confirmDeleteConnector}
                />
            )}
            {connectorRuns && (
                <ConnectorRunsModal
                    connector={connectorRuns}
                    onClose={() => setConnectorRuns(null)}
                />
            )}
            {deleting && (
                <DeleteMergeModal
                    merge={deleting}
                    error={deleteError}
                    isPending={deleteMergeMutation.isPending}
                    onClose={() => setDeleting(null)}
                    onConfirm={confirmDelete}
                />
            )}
        </>
    )
}
