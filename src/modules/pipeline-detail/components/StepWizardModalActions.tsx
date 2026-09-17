import i18n from '@dhis2/d2-i18n'
import { Button, ButtonStrip, IconChevronLeft16, ModalActions } from '@dhis2/ui'
import React from 'react'

type StepWizardModalActionsProps = {
    idx: number
    isSubmitting: boolean
    onClose: () => void
    onBack: () => void
    onPrimaryAction: () => void | Promise<void>
    primaryLabel: string
    primaryPendingLabel: string
    primaryPending?: boolean
    primaryDisabled?: boolean
    primaryIcon: React.ReactNode
}

export function StepWizardModalActions({
    idx,
    isSubmitting,
    onClose,
    onBack,
    onPrimaryAction,
    primaryLabel,
    primaryPendingLabel,
    primaryPending = false,
    primaryDisabled = false,
    primaryIcon,
}: StepWizardModalActionsProps): React.ReactElement {
    return (
        <ModalActions>
            <ButtonStrip>
                <Button type="button" onClick={onClose} disabled={isSubmitting}>
                    {i18n.t('Cancel')}
                </Button>
                <Button
                    type="button"
                    disabled={idx === 0 || isSubmitting}
                    onClick={onBack}
                    icon={<IconChevronLeft16 />}
                >
                    {i18n.t('Back')}
                </Button>
                <Button
                    primary
                    type="button"
                    onClick={() => void onPrimaryAction()}
                    loading={primaryPending}
                    disabled={primaryDisabled || isSubmitting}
                    icon={
                        React.isValidElement(primaryIcon)
                            ? primaryIcon
                            : undefined
                    }
                >
                    {primaryPending ? primaryPendingLabel : primaryLabel}
                </Button>
            </ButtonStrip>
        </ModalActions>
    )
}
