import React, { act, useEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { FormProvider, useForm } from 'react-hook-form'
import { ConnectorFormBody } from './ConnectorFormBody'
import type { HandlerDescriptor } from '@/capsApi/types'
import {
    defaultConnectorFormValues,
    type ConnectorFormValues,
} from '@/modules/pipeline-connectors/schemas/connectorFormSchema'
import type { PipelineStep } from '@/shared/types/caps'

type Form = ReturnType<typeof useForm<ConnectorFormValues>>

function step(id: string, name: string, handlerKey: string): PipelineStep {
    return {
        id,
        pipelineId: 'p',
        name,
        description: null,
        handlerKey,
        stepOrder: 0,
        maxRetries: 0,
        retryDelayMs: 0,
        inputSchema: null,
        handlerConfig: null,
    }
}

const STEPS = [
    step('s0', 'Upload values', 'dhis2-data-upload'),
    step('s1', 'Tell the team', 'dhis2-notify'),
    // A handler this engine does not describe the results of
    step('s2', 'Legacy step', 'not-described'),
]

const HANDLERS: HandlerDescriptor[] = [
    {
        key: 'dhis2-data-upload',
        displayName: 'DHIS2 Data Upload',
        description: '',
        tags: [],
        queueName: 'step.dhis2-data-upload',
        outputs: {
            fields: [
                { key: 'imported', label: 'Values imported', type: 'number' },
                { key: 'ignored', label: 'Values ignored', type: 'number' },
            ],
        },
    },
    {
        key: 'dhis2-notify',
        displayName: 'Notify',
        description: '',
        tags: [],
        queueName: 'step.dhis2-notify',
        outputs: { passThrough: true },
    },
]

function Harness({
    defaults,
    onReady,
    steps = STEPS,
}: {
    defaults: ConnectorFormValues
    onReady: (form: Form) => void
    steps?: PipelineStep[]
}): React.ReactElement {
    const form = useForm<ConnectorFormValues>({ defaultValues: defaults })
    useEffect(() => {
        onReady(form)
    }, [form, onReady])
    return (
        <FormProvider {...form}>
            <ConnectorFormBody
                targetOptions={[{ id: 'target', name: 'Release alerts' }]}
                targetOptionsLoading={false}
                sourceSteps={steps}
                handlers={HANDLERS}
            />
        </FormProvider>
    )
}

function clickButton(container: HTMLElement, label: string) {
    const button = Array.from(container.querySelectorAll('button')).find(
        (b) => b.textContent?.trim() === label
    )
    if (!button) {
        throw new Error(`No button "${label}"`)
    }
    act(() => {
        button.click()
    })
}

describe('ConnectorFormBody', () => {
    let container: HTMLDivElement
    let root: Root
    let form: Form

    async function render(
        defaults: ConnectorFormValues,
        steps: PipelineStep[] = STEPS
    ) {
        ;(
            globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }
        ).IS_REACT_ACT_ENVIRONMENT = true
        container = document.createElement('div')
        document.body.appendChild(container)
        root = createRoot(container)
        await act(async () => {
            root.render(
                <Harness
                    defaults={defaults}
                    steps={steps}
                    onReady={(f) => {
                        form = f
                    }}
                />
            )
        })
    }

    afterEach(async () => {
        await act(async () => {
            root.unmount()
        })
        container.remove()
    })

    it('starts conditions mode with one editable row', async () => {
        await render(defaultConnectorFormValues)

        clickButton(container, 'Only if…')

        expect(form.getValues('ruleMode')).toBe('conditions')
        expect(form.getValues('ruleConditions')).toHaveLength(1)
    })

    it('shows a stored path as the step and its labelled result', async () => {
        await render({
            ...defaultConnectorFormValues,
            ruleMode: 'conditions',
            ruleConditions: [
                {
                    path: 'stepOutputs.s0.imported',
                    operator: 'gt',
                    value: '0',
                },
            ],
        })

        expect(container.textContent).toContain('Step 1: Upload values')
        expect(container.textContent).toContain('Values imported')
        expect(container.textContent).toContain('is more than')
        // Only the number is typed
        expect(
            Array.from(container.querySelectorAll('input'))
                .filter((input) => input.type !== 'number')
                .map((input) => input.placeholder)
        ).not.toContain('Path, e.g. scheduledAt')
    })

    it('reads a pass-through step’s results from the step before it', async () => {
        await render({
            ...defaultConnectorFormValues,
            ruleMode: 'conditions',
            ruleConditions: [
                { path: 'stepOutputs.s1.ignored', operator: 'eq', value: '0' },
            ],
        })

        expect(container.textContent).toContain('Step 2: Tell the team')
        expect(container.textContent).toContain('Values ignored')
    })

    it('saves an older position path by step id', async () => {
        await render({
            ...defaultConnectorFormValues,
            ruleMode: 'conditions',
            ruleConditions: [
                { path: 'step_0_output.imported', operator: 'gt', value: '0' },
            ],
        })

        expect(form.getValues('ruleConditions.0.path')).toBe(
            'stepOutputs.s0.imported'
        )
        expect(container.textContent).toContain('Values imported')
    })

    it('only offers Always start and Only if…', async () => {
        await render(defaultConnectorFormValues)

        const labels = Array.from(
            container.querySelectorAll('[role="radio"]')
        ).map((b) => b.textContent?.trim())
        expect(labels).toContain('Only if…')
        expect(labels).not.toContain('Custom (JSON)')
    })

    it('keeps a rule written outside the app and says so', async () => {
        await render({
            ...defaultConnectorFormValues,
            ruleMode: 'json',
            ruleJson: '{"==": [{"var": "status"}, "FAILED"]}',
        })

        expect(container.textContent).toContain(
            'This rule was written outside the app'
        )
        expect(container.textContent).toContain('"status"')
        expect(form.getValues('ruleMode')).toBe('json')

        clickButton(container, 'Only if…')
        expect(form.getValues('ruleMode')).toBe('conditions')
        expect(form.getValues('ruleConditions')).toHaveLength(1)
    })

    it('explains when no step has a count to check', async () => {
        await render(
            { ...defaultConnectorFormValues, ruleMode: 'conditions' },
            [step('s2', 'Legacy step', 'not-described')]
        )

        expect(container.textContent).toContain('Nothing to check')
        expect(container.textContent).not.toContain('Add condition')
        expect(container.textContent).not.toContain('Otherwise start')
    })

    it('offers an otherwise pipeline only behind a condition', async () => {
        await render(defaultConnectorFormValues)
        expect(container.textContent).not.toContain('Otherwise start')

        clickButton(container, 'Only if…')
        expect(container.textContent).toContain('Otherwise start (optional)')
    })
})
