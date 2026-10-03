import React, { act, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { FormProvider, useForm, type UseFormReturn } from 'react-hook-form'
import { Dhis2AnalyticsRunConfig } from './Dhis2AnalyticsRunConfig'
import { defaultDhis2AnalyticsRunConfig } from '@/modules/dhis2-analytics-run/schemas/config'

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
                    skipOutliers: true,
                    skipResourceTables: false,
                    skipTrackedEntities: true,
                    skipValidationResult: false,
                }),
                polling: expect.objectContaining({
                    pollIntervalMs: 5000,
                    maxAttempts: 120,
                }),
            })
        )

        // Starts on all years, like the DHIS2 Data Administration app.
        expect(onChange.mock.calls[0][0].runOptions).not.toHaveProperty(
            'lastYears'
        )

        await act(async () => {
            root.unmount()
        })
    })

    it('shows "All" after clearing a saved last-years value', async () => {
        ;(
            globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }
        ).IS_REACT_ACT_ENVIRONMENT = true
        const saved = defaultDhis2AnalyticsRunConfig()
        saved.runOptions.lastYears = 0
        let form: UseFormReturn<{ handlerConfig: unknown }> | undefined

        function EditHarness(): React.ReactElement {
            const f = useForm<{ handlerConfig: unknown }>({
                defaultValues: { handlerConfig: saved },
            })
            form = f
            return (
                <FormProvider {...f}>
                    <Dhis2AnalyticsRunConfig
                        value={saved}
                        onChange={jest.fn()}
                    />
                </FormProvider>
            )
        }

        const container = document.createElement('div')
        const root = createRoot(container)
        await act(async () => {
            root.render(<EditHarness />)
        })
        expect(container.textContent).toContain('0')
        expect(container.textContent).not.toContain('All')

        // What choosing "All" does: the select clears lastYears to undefined.
        await act(async () => {
            form?.setValue(
                'handlerConfig.runOptions.lastYears' as never,
                undefined as never
            )
        })
        expect(container.textContent).toContain('All')

        await act(async () => {
            root.unmount()
        })
    })
})
