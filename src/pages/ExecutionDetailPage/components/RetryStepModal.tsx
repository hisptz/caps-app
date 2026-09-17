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
import React, { useEffect, useId } from 'react'

type Props = {
    open: boolean
    stepName: string
    attemptNumber: number
    isPending: boolean
    errorMessage: string | null
    onClose: () => void
    onConfirm: () => void
}

export function RetryStepModal({
    open,
    stepName,
    attemptNumber,
    isPending,
    errorMessage,
    onClose,
    onConfirm,
}: Props): React.ReactElement | null {
    const titleId = useId()

    useEffect(() => {
        if (!open) {
            return
        }
        const previouslyFocused = document.activeElement as HTMLElement | null
        return () => {
            previouslyFocused?.focus?.()
        }
    }, [open])

    if (!open) {
        return null
    }

    return (
        <Modal onClose={isPending ? undefined : onClose} position="middle">
            <ModalTitle>
                <span id={titleId}>{i18n.t('Retry step?')}</span>
            </ModalTitle>
            <ModalContent>
                <p>
                    {i18n.t(
                        'Retry "{{name}}" (attempt {{n}}) on this same execution. Prior attempts and logs are kept. Downstream steps resume only after this attempt succeeds.',
                        {
                            name: stepName,
                            n: String(attemptNumber),
                        }
                    )}
                </p>
                {errorMessage && (
                    <div role="alert" aria-live="assertive">
                        <NoticeBox error title={i18n.t('Could not retry step')}>
                            {errorMessage}
                        </NoticeBox>
                    </div>
                )}
            </ModalContent>
            <ModalActions>
                <ButtonStrip end>
                    <Button onClick={onClose} disabled={isPending}>
                        {i18n.t('Cancel')}
                    </Button>
                    <Button
                        primary
                        onClick={onConfirm}
                        loading={isPending}
                        disabled={isPending}
                    >
                        {i18n.t('Retry step')}
                    </Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    )
}
