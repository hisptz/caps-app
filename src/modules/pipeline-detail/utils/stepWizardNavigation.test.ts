import type { FormEvent } from 'react'
import { handleStepWizardFormSubmit } from '@/modules/pipeline-detail/utils/stepWizardNavigation'

describe('handleStepWizardFormSubmit', () => {
    it('advances the wizard when not on the last panel', () => {
        const onAdvance = jest.fn()
        const onFinalSubmit = jest.fn()
        const event = {
            preventDefault: jest.fn(),
        } as unknown as FormEvent<HTMLFormElement>

        handleStepWizardFormSubmit(event, {
            isLast: false,
            onAdvance,
            onFinalSubmit,
        })

        expect(event.preventDefault).toHaveBeenCalled()
        expect(onAdvance).toHaveBeenCalled()
        expect(onFinalSubmit).not.toHaveBeenCalled()
    })

    it('submits only on the last panel', () => {
        const onAdvance = jest.fn()
        const onFinalSubmit = jest.fn()
        const event = {
            preventDefault: jest.fn(),
        } as unknown as FormEvent<HTMLFormElement>

        handleStepWizardFormSubmit(event, {
            isLast: true,
            onAdvance,
            onFinalSubmit,
        })

        expect(event.preventDefault).toHaveBeenCalled()
        expect(onFinalSubmit).toHaveBeenCalled()
        expect(onAdvance).not.toHaveBeenCalled()
    })
})
