import type { UseFormReturn } from 'react-hook-form'
import { STEP_WIZARD_PANEL_FIELDS } from '@/modules/pipeline-detail/components/StepWizardBody'
import type { PipelineStepFormWithHandlerValues } from '@/modules/pipeline-detail/schemas/stepFormSchema'
import {
    getStepWizardPanelLabel,
    STEP_WIZARD_PANELS,
    type StepWizardPanel,
} from '@/modules/pipeline-detail/utils/stepWizardNavigation'

/**
 * Shared step-wizard rail navigation: advancing/going back between panels,
 * and the final-panel submit dispatch. Used by both the Add and Edit step
 * modals, which otherwise duplicate this logic verbatim.
 */
export function useStepWizardFlow({
    form,
    active,
    setActive,
    onSubmit,
    panels = STEP_WIZARD_PANELS,
    canAdvance = () => true,
}: {
    form: UseFormReturn<PipelineStepFormWithHandlerValues>
    active: StepWizardPanel
    setActive: (panel: StepWizardPanel) => void
    onSubmit: (values: PipelineStepFormWithHandlerValues) => void
    panels?: readonly StepWizardPanel[]
    canAdvance?: () => boolean
}) {
    const idx = panels.indexOf(active)
    const isLast = idx === panels.length - 1

    const goNext = async () => {
        if (!canAdvance()) {
            return
        }
        const fields = STEP_WIZARD_PANEL_FIELDS[active]
        const valid = await form.trigger(fields)
        if (!valid) {
            return
        }
        setActive(panels[idx + 1])
    }

    const goBack = () => {
        if (idx === 0) {
            return
        }
        setActive(panels[idx - 1])
    }

    const submitForm = () => {
        void form.handleSubmit(onSubmit)()
    }

    const handlePrimaryAction = async () => {
        if (isLast) {
            submitForm()
            return
        }
        await goNext()
    }

    const nextPanelLabel = !isLast
        ? getStepWizardPanelLabel(panels[idx + 1])
        : ''

    return {
        idx,
        isLast,
        nextPanelLabel,
        goNext,
        goBack,
        submitForm,
        handlePrimaryAction,
    }
}
