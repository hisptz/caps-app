import i18n from '@dhis2/d2-i18n'
import {
    Button,
    ButtonStrip,
    IconDelete16,
    IconEdit16,
    IconLaunch16,
} from '@dhis2/ui'
import React from 'react'
import { useBoolean } from 'usehooks-ts'
import { PipelineEditModal } from '@/modules/pipelines/components/PipelineEditModal'
import { useTriggerPipeline } from '@/modules/pipelines/hooks/useTriggerPipeline'
import { DeletePipelineConfirmModal } from '@/pages/PipelinesPage/components/DeletePipelineConfirmModal'
import type { Pipeline } from '@/shared/types/caps'

export function PipelineTableActions({ pipeline }: { pipeline: Pipeline }) {
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

    const { handleTrigger } = useTriggerPipeline({
        pipelineId: pipeline.id,
    })

    return (
        <>
            <ButtonStrip>
                <Button
                    small
                    icon={<IconLaunch16 />}
                    aria-label={i18n.t('Trigger pipeline')}
                    onClick={handleTrigger}
                />
                <Button
                    small
                    icon={<IconEdit16 />}
                    aria-label={i18n.t('Edit pipeline')}
                    onClick={openEdit}
                />
                <Button
                    small
                    destructive
                    icon={<IconDelete16 />}
                    aria-label={i18n.t('Delete pipeline')}
                    onClick={openDelete}
                />
            </ButtonStrip>

            {editOpen && (
                <PipelineEditModal
                    pipeline={pipeline}
                    open={editOpen}
                    onClose={closeEdit}
                />
            )}
            {deleteOpen && (
                <DeletePipelineConfirmModal
                    pipeline={pipeline}
                    onClose={closeDelete}
                />
            )}
        </>
    )
}
