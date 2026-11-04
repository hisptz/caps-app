import i18n from '@dhis2/d2-i18n'
import {
    Button,
    ButtonStrip,
    Modal,
    ModalActions,
    ModalContent,
    ModalTitle,
    NoticeBox,
} from '@dhis2/ui'
import React from 'react'
import { NO_ESCAPE } from '@/modules/pipeline-connectors/utils/connectorLabels'
import type { Workflow } from '@/shared/types/caps'

type Props = {
    workflow: Workflow
    error: string | null
    isPending: boolean
    onClose: () => void
    onConfirm: () => void
}

export function DeleteWorkflowModal({
    workflow,
    error,
    isPending,
    onClose,
    onConfirm,
}: Props): React.ReactElement {
    return (
        <Modal onClose={onClose}>
            <ModalTitle>{i18n.t('Delete workflow?')}</ModalTitle>
            <ModalContent>
                <p>
                    {i18n.t(
                        'This removes "{{name}}", its schedule and its run history. Its pipelines, their connectors and their own runs are kept. This cannot be undone.',
                        { name: workflow.name, interpolation: NO_ESCAPE }
                    )}
                </p>
                {error && (
                    <NoticeBox
                        error
                        title={i18n.t('Could not delete workflow')}
                    >
                        {error}
                    </NoticeBox>
                )}
            </ModalContent>
            <ModalActions>
                <ButtonStrip end>
                    <Button onClick={onClose}>{i18n.t('Cancel')}</Button>
                    <Button
                        destructive
                        disabled={isPending}
                        onClick={onConfirm}
                    >
                        {isPending ? i18n.t('Deleting…') : i18n.t('Delete')}
                    </Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    )
}
