import { useDataEngine } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import {
    Button,
    ButtonStrip,
    DropdownButton,
    FlyoutMenu,
    IconAdd16,
    MenuItem,
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
import { useConnectorMutations } from '@/modules/pipeline-connectors/hooks/usePipelineConnectors'
import {
    connectorFormValuesToCreateBody,
    connectorFormValuesToUpdateBody,
    type ConnectorFormValues,
} from '@/modules/pipeline-connectors/schemas/connectorFormSchema'
import { AddWorkflowPipelineModal } from '@/modules/workflows/components/AddWorkflowPipelineModal'
import { DeleteMergeModal } from '@/modules/workflows/components/DeleteMergeModal'
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
    const { createConnectorMutation, updateConnectorMutation } =
        useConnectorMutations(engine)

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

    const canMerge = workflow.pipelines.length >= 3

    return (
        <>
            <WorkflowFlow
                workflow={workflow}
                latestRun={latestRun}
                selectedNodeId={selectedNode?.id ?? null}
                onSelect={setSelected}
                toolbar={
                    <>
                        <Button
                            small
                            icon={<IconAdd16 />}
                            onClick={() => setShowAddPipeline(true)}
                        >
                            {i18n.t('Add pipeline')}
                        </Button>
                        <DropdownButton
                            small
                            icon={<IconAdd16 />}
                            disabled={workflow.pipelines.length === 0}
                            component={
                                <FlyoutMenu dense>
                                    <MenuItem
                                        label={i18n.t('From one pipeline…')}
                                        onClick={() =>
                                            setConnectorEditor({
                                                step: 'source',
                                            })
                                        }
                                    />
                                    <MenuItem
                                        label={i18n.t(
                                            'Waits for several pipelines…'
                                        )}
                                        disabled={!canMerge}
                                        onClick={() =>
                                            setMergeModal({
                                                open: true,
                                                merge: null,
                                            })
                                        }
                                    />
                                </FlyoutMenu>
                            }
                        >
                            {i18n.t('Add connector')}
                        </DropdownButton>
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

            <AddWorkflowPipelineModal
                open={showAddPipeline}
                workflowId={workflow.id}
                onClose={() => setShowAddPipeline(false)}
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
                    isPending={
                        createConnectorMutation.isPending ||
                        updateConnectorMutation.isPending
                    }
                    onSubmit={saveConnector}
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
