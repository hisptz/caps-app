import i18n from '@dhis2/d2-i18n'
import {
    Button,
    ButtonStrip,
    Modal,
    ModalActions,
    ModalContent,
    ModalTitle,
} from '@dhis2/ui'
import React from 'react'

type Props = {
    isPending: boolean
    onClose: () => void
    onConfirm: () => void
}

export function CancelExecutionModal({
    isPending,
    onClose,
    onConfirm,
}: Props): React.ReactElement {
    return (
        <Modal onClose={onClose}>
            <ModalTitle>{i18n.t('Cancel execution?')}</ModalTitle>
            <ModalContent>
                <p>
                    {i18n.t(
                        'The run will stop after the current step where possible. This action cannot be undone from the UI alone.'
                    )}
                </p>
            </ModalContent>
            <ModalActions>
                <ButtonStrip end>
                    <Button disabled={isPending} onClick={onClose}>
                        {i18n.t('Keep running')}
                    </Button>
                    <Button
                        destructive
                        loading={isPending}
                        disabled={isPending}
                        onClick={onConfirm}
                    >
                        {i18n.t('Confirm cancel')}
                    </Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    )
}
