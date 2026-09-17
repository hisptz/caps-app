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
import type { PipelineStep } from '@/shared/types/caps'

type Props = {
    step: PipelineStep
    error: string | null
    isPending: boolean
    onClose: () => void
    onConfirm: () => void
}

export function DeleteStepModal({
    step,
    error,
    isPending,
    onClose,
    onConfirm,
}: Props): React.ReactElement {
    return (
        <Modal onClose={onClose}>
            <ModalTitle>{i18n.t('Delete step?')}</ModalTitle>
            <ModalContent>
                <p>
                    {i18n.t(
                        'This will remove "{{name}}" and cannot be undone.',
                        { name: step.name }
                    )}
                </p>
                {error && (
                    <NoticeBox error title={i18n.t('Could not delete step')}>
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
