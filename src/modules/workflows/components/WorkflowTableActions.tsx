import { useDataEngine } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import {
    Button,
    ButtonStrip,
    IconDelete16,
    IconEdit16,
    IconLaunch16,
} from '@dhis2/ui'
import React, { useState } from 'react'
import { useBoolean } from 'usehooks-ts'
import { DeleteWorkflowModal } from '@/modules/workflows/components/DeleteWorkflowModal'
import { WorkflowModal } from '@/modules/workflows/components/WorkflowModal'
import { useRunWorkflow } from '@/modules/workflows/hooks/useRunWorkflow'
import { useWorkflowMutations } from '@/modules/workflows/hooks/useWorkflows'
import type { WorkflowListItem } from '@/shared/types/caps'

export function WorkflowTableActions({
    workflow,
}: {
    workflow: WorkflowListItem
}) {
    const engine = useDataEngine()
    const { deleteWorkflowMutation } = useWorkflowMutations(engine)
    const { run, isRunning } = useRunWorkflow()
    const [deleteError, setDeleteError] = useState<string | null>(null)
    const {
        value: editOpen,
        setTrue: openEdit,
        setFalse: closeEdit,
    } = useBoolean()
    const {
        value: deleteOpen,
        setTrue: openDelete,
        setFalse: closeDelete,
    } = useBoolean()

    const closeDeleteModal = () => {
        closeDelete()
        setDeleteError(null)
    }

    const confirmDelete = () => {
        setDeleteError(null)
        deleteWorkflowMutation.mutate(workflow.id, {
            onSuccess: closeDelete,
            onError: (err) =>
                setDeleteError(
                    err instanceof Error
                        ? err.message
                        : i18n.t('Could not delete the workflow')
                ),
        })
    }

    return (
        <>
            <ButtonStrip>
                <Button
                    small
                    icon={<IconLaunch16 />}
                    aria-label={i18n.t('Trigger workflow')}
                    title={i18n.t('Trigger workflow')}
                    disabled={
                        !workflow.isActive ||
                        workflow._count.pipelines === 0 ||
                        isRunning
                    }
                    onClick={() => run(workflow.id)}
                />
                <Button
                    small
                    icon={<IconEdit16 />}
                    aria-label={i18n.t('Edit workflow')}
                    title={i18n.t('Edit workflow')}
                    onClick={openEdit}
                />
                <Button
                    small
                    destructive
                    icon={<IconDelete16 />}
                    aria-label={i18n.t('Delete workflow')}
                    title={i18n.t('Delete workflow')}
                    onClick={openDelete}
                />
            </ButtonStrip>

            {editOpen && (
                <WorkflowModal
                    open={editOpen}
                    workflow={workflow}
                    onClose={closeEdit}
                />
            )}
            {deleteOpen && (
                <DeleteWorkflowModal
                    workflow={workflow}
                    error={deleteError}
                    isPending={deleteWorkflowMutation.isPending}
                    onClose={closeDeleteModal}
                    onConfirm={confirmDelete}
                />
            )}
        </>
    )
}
