import i18n from '@dhis2/d2-i18n'
import type { FormEvent } from 'react'

export const STEP_WIZARD_PANELS = [
    'basics',
    'handler',
    'configuration',
] as const
export type StepWizardPanel = (typeof STEP_WIZARD_PANELS)[number]

export function getStepWizardPanelLabel(panel: StepWizardPanel): string {
    const labels: Record<StepWizardPanel, string> = {
        basics: i18n.t('Basics'),
        handler: i18n.t('Handler'),
        configuration: i18n.t('Configuration'),
    }
    return labels[panel]
}

/**
 * Keeps implicit form submission (Enter in inputs) on the same path as the
 * wizard primary action, and blocks full submit until the last panel.
 */
export type StepWizardFormSubmitOptions = {
    isLast: boolean
    onAdvance: () => void | Promise<void>
    onFinalSubmit: () => void
}

export function handleStepWizardFormSubmit(
    event: FormEvent<HTMLFormElement>,
    { isLast, onAdvance, onFinalSubmit }: StepWizardFormSubmitOptions
): void {
    event.preventDefault()
    if (isLast) {
        onFinalSubmit()
        return
    }
    void onAdvance()
}
