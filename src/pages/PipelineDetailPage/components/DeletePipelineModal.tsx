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

type Props = {
    pipelineName: string
    error: string | null
    isPending: boolean
    onClose: () => void
    onConfirm: () => void
}

export function DeletePipelineModal({
    pipelineName,
    error,
    isPending,
    onClose,
    onConfirm,
}: Props): React.ReactElement {
    return (
        <Modal onClose={onClose}>
            <ModalTitle>{i18n.t('Delete pipeline?')}</ModalTitle>
            <ModalContent>
                {error && (
                    <NoticeBox
                        error
                        title={i18n.t('Could not delete pipeline')}
                    >
                        {error}
                    </NoticeBox>
                )}
                <p>
                    {i18n.t(
                        'This will remove "{{name}}" and cannot be undone.',
                        { name: pipelineName }
                    )}
                </p>
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
