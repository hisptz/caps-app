import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { FormProvider, useForm } from 'react-hook-form'
import { HandlerConfigForm } from './HandlerConfigForm'
import type { PipelineStepFormWithHandlerValues } from '@/modules/pipeline-detail/schemas/stepFormSchema'

function Harness({
    onChange,
}: {
    onChange: (value: Record<string, unknown>) => void
}): React.ReactElement {
    const form = useForm<PipelineStepFormWithHandlerValues>({
        defaultValues: {
            stepOrder: 1,
            name: 'Step',
            handlerKey: 'prediction-poll',
            handlerConfig: null,
        },
    })

    return (
        <FormProvider {...form}>
            <HandlerConfigForm
                handlerKey="prediction-poll"
                value={null}
                onChange={onChange}
            />
        </FormProvider>
    )
}

describe('prediction-poll handler config form', () => {
    it('initializes the handler config defaults and renders both settings', async () => {
        ;(
            globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }
        ).IS_REACT_ACT_ENVIRONMENT = true
        const onChange = jest.fn()
        const container = document.createElement('div')
        const root = createRoot(container)

        await act(async () => {
            root.render(<Harness onChange={onChange} />)
        })

        expect(onChange).toHaveBeenCalledWith({
            polling: {
                intervalSeconds: 30,
                timeoutHours: 6,
            },
        })
        expect(container.textContent).toContain('Poll interval (seconds)')
        expect(container.textContent).toContain('Timeout (hours)')
        const inputs = container.querySelectorAll('input')
        expect(inputs[0].value).toBe('30')
        expect(inputs[1].value).toBe('6')

        await act(async () => {
            root.unmount()
        })
    })
})
