import React, { act, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { FormProvider, useForm } from 'react-hook-form'
import { Dhis2AnalyticsRunConfig } from './Dhis2AnalyticsRunConfig'

function Harness({
    onChange,
}: {
    onChange: (v: Record<string, unknown>) => void
}): React.ReactElement {
    const form = useForm({
        defaultValues: {
            handlerConfig: null,
        },
    })

    // Ensure effects flush and the value is initialized once mounted.
    useEffect(() => {
        void form.trigger()
    }, [form])

    return (
        <FormProvider {...form}>
            <Dhis2AnalyticsRunConfig value={null} onChange={onChange} />
        </FormProvider>
    )
}

describe('Dhis2AnalyticsRunConfig', () => {
    it('initializes default config when handlerConfig is null', async () => {
        ;(
            globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }
        ).IS_REACT_ACT_ENVIRONMENT = true
        const onChange = jest.fn()
        const container = document.createElement('div')
        const root = createRoot(container)

        await act(async () => {
            root.render(<Harness onChange={onChange} />)
        })

        expect(onChange).toHaveBeenCalledWith(
            expect.objectContaining({
                runOptions: expect.objectContaining({
                    skipAggregate: false,
                    skipEnrollment: false,
                    skipEvents: false,
                    skipOrgUnitOwnership: false,
                    skipOutliers: false,
                    skipResourceTables: false,
                    skipTrackedEntities: false,
                    skipValidationResult: false,
                }),
                polling: expect.objectContaining({
                    pollIntervalMs: 5000,
                    maxAttempts: 120,
                }),
            })
        )

        await act(async () => {
            root.unmount()
        })
    })
})
