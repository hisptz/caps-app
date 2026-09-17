jest.mock('@/shared/components/HandlerConfigForms/HandlerConfigForm', () => ({
    HandlerConfigForm: () => null,
}))

import { CustomDataProvider, Provider } from '@dhis2/app-runtime'
import { zodResolver } from '@hookform/resolvers/zod'
import type { UseMutationResult } from '@tanstack/react-query'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { FormProvider, useForm } from 'react-hook-form'
import { capsBackendUrlFormSchema } from '@/capsApi/dhis2CapsRoute'
import type { HandlerDescriptor } from '@/capsApi/types'
import { PipelineAddScheduleModal } from '@/modules/pipeline-detail/components/PipelineAddScheduleModal'
import { PipelineAddStepModal } from '@/modules/pipeline-detail/components/PipelineAddStepModal'
import { PipelineEditStepModal } from '@/modules/pipeline-detail/components/PipelineEditStepModal'
import { PipelineCreateModal } from '@/modules/pipelines/components/PipelineCreateModal'
import { SettingsForm } from '@/modules/settings/SettingsForm'
import type { PipelineStep } from '@/shared/types/caps'

const testHandlers: HandlerDescriptor[] = [
    {
        key: 'climate-openeo-create',
        displayName: 'Open Climate Service Create',
        description: 'Test handler',
        tags: ['climate', 'openeo'],
        queueName: 'step.climate-openeo-create',
    },
]

const testConfig = {
    baseUrl: 'http://localhost:8080',
    apiVersion: 41,
}

function noopMutation<T>(): UseMutationResult<unknown, unknown, T, unknown> {
    return {
        mutate: () => undefined,
        isPending: false,
    } as unknown as UseMutationResult<unknown, unknown, T, unknown>
}

function SettingsFormHarness(): React.ReactElement {
    const form = useForm({
        resolver: zodResolver(capsBackendUrlFormSchema),
        defaultValues: { capsBackendUrl: 'https://caps.example.org' },
    })
    return (
        <FormProvider {...form}>
            <SettingsForm
                loading={false}
                route={{ id: 'route-1' }}
                refetch={async () => undefined}
            />
        </FormProvider>
    )
}

function mount(ui: React.ReactElement): void {
    const container = document.createElement('div')
    const root = createRoot(container)
    root.render(
        <Provider
            config={testConfig}
            userInfo={undefined}
            plugin={false}
            parentAlertsAdd={() => undefined}
            showAlertsInPlugin={false}
        >
            <CustomDataProvider data={{}} options={{ failOnMiss: false }}>
                {ui}
            </CustomDataProvider>
        </Provider>
    )
    root.unmount()
}

describe('configuration forms smoke', () => {
    it('mounts SettingsForm without crashing', () => {
        mount(<SettingsFormHarness />)
    })

    it('mounts PipelineCreateModal without crashing', () => {
        mount(<PipelineCreateModal open onClose={() => undefined} />)
    })

    it('mounts PipelineAddStepModal without crashing', () => {
        mount(
            <PipelineAddStepModal
                open
                onClose={() => undefined}
                defaultStepOrder={1}
                createStepMutation={noopMutation()}
                handlers={testHandlers}
            />
        )
    })

    const editStepFixture: PipelineStep = {
        id: 'step-1',
        pipelineId: 'pipe-1',
        name: 'Download ERA5',
        description: null,
        handlerKey: 'climate-openeo-create',
        stepOrder: 1,
        maxRetries: 3,
        retryDelayMs: 1000,
        inputSchema: null,
        handlerConfig: null,
    }

    it('mounts PipelineEditStepModal with locked handler catalog', () => {
        mount(
            <PipelineEditStepModal
                open
                step={editStepFixture}
                onClose={() => undefined}
                initialPanel="handler"
                updateStepMutation={noopMutation()}
                handlers={testHandlers}
            />
        )
    })

    it('mounts PipelineAddScheduleModal without crashing', () => {
        mount(
            <PipelineAddScheduleModal
                open
                onClose={() => undefined}
                steps={[]}
                handlers={testHandlers}
            />
        )
    })
})
