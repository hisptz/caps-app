jest.mock('@/shared/components/HandlerConfigForms/HandlerConfigForm', () => ({
    HandlerConfigForm: () => null,
}))

import { CustomDataProvider, Provider } from '@dhis2/app-runtime'
import React, { act, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { FormProvider, useForm } from 'react-hook-form'
import {
    StepWizardBody,
    type StepWizardPanel,
} from '@/modules/pipeline-detail/components/StepWizardBody'
import type { PipelineStepFormWithHandlerValues } from '@/modules/pipeline-detail/schemas/stepFormSchema'

const testConfig = {
    baseUrl: 'http://localhost:8080',
    apiVersion: 41,
}

function StepWizardHarness({
    active,
    onReady,
}: {
    active: StepWizardPanel
    onReady: (
        form: ReturnType<typeof useForm<PipelineStepFormWithHandlerValues>>
    ) => void
}): React.ReactElement {
    const form = useForm<PipelineStepFormWithHandlerValues>({
        defaultValues: {
            stepOrder: 1,
            name: 'Step',
            description: '',
            handlerKey: 'climate-openeo-create',
            maxRetries: 3,
            retryDelayMs: 1000,
            handlerConfig: null,
        },
    })

    useEffect(() => {
        onReady(form)
    }, [form, onReady])

    return (
        <FormProvider {...form}>
            <StepWizardBody
                active={active}
                onActiveChange={() => undefined}
                handlers={[
                    {
                        key: 'climate-openeo-create',
                        displayName: 'Open Climate Service Create',
                        description: 'Test',
                        tags: ['climate'],
                        queueName: 'step.climate-openeo-create',
                    },
                ]}
            />
        </FormProvider>
    )
}

describe('StepWizardBody configuration errors', () => {
    it('shows handlerConfig validation errors in a NoticeBox', async () => {
        ;(
            globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }
        ).IS_REACT_ACT_ENVIRONMENT = true

        const container = document.createElement('div')
        document.body.appendChild(container)
        const root = createRoot(container)

        const errorMessage = 'Handler configuration is required'

        await act(async () => {
            root.render(
                <Provider
                    config={testConfig}
                    userInfo={undefined}
                    plugin={false}
                    parentAlertsAdd={() => undefined}
                    showAlertsInPlugin={false}
                >
                    <CustomDataProvider
                        data={{}}
                        options={{ failOnMiss: false }}
                    >
                        <StepWizardHarness
                            active="configuration"
                            onReady={(form) => {
                                form.setError('handlerConfig', {
                                    type: 'manual',
                                    message: errorMessage,
                                })
                            }}
                        />
                    </CustomDataProvider>
                </Provider>
            )
        })

        expect(container.textContent).toContain(errorMessage)
        expect(container.textContent).toContain(
            'Handler configuration has errors'
        )

        await act(async () => {
            root.unmount()
        })
        container.remove()
    })
})
