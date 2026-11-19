import React, { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { FormProvider, useForm, type UseFormReturn } from 'react-hook-form'
import type { JsonSchema } from './jsonSchema'
import { SchemaConfigForm } from './SchemaConfigForm'

/** What a plugin's config might look like, e.g. an EWARS fetch step */
const pluginSchema: JsonSchema = {
    type: 'object',
    properties: {
        indicator: {
            type: 'string',
            title: 'EWARS indicator',
            description: 'The indicator to fetch.',
            maxLength: 100,
        },
        periodType: { type: 'string', enum: ['WEEKLY', 'MONTHLY'] },
        lookbackPeriods: {
            type: 'integer',
            minimum: 1,
            maximum: 52,
            default: 4,
        },
        failOnEmpty: { type: 'boolean', default: false },
        locations: { type: 'array', items: { type: 'string' } },
        polling: {
            type: 'object',
            properties: {
                intervalSeconds: { type: 'integer', default: 30 },
            },
        },
    },
    required: ['indicator', 'periodType'],
}

let form: UseFormReturn<{ handlerConfig: Record<string, unknown> | null }>

function Harness({
    handlerConfig,
}: {
    handlerConfig: Record<string, unknown> | null
}): React.ReactElement {
    form = useForm({ defaultValues: { handlerConfig } })
    return (
        <FormProvider {...form}>
            <SchemaConfigForm name="handlerConfig" schema={pluginSchema} />
        </FormProvider>
    )
}

describe('SchemaConfigForm', () => {
    let container: HTMLDivElement
    let root: Root

    beforeEach(() => {
        ;(
            globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }
        ).IS_REACT_ACT_ENVIRONMENT = true
        container = document.createElement('div')
        document.body.appendChild(container)
        root = createRoot(container)
    })

    afterEach(() => {
        act(() => root.unmount())
        container.remove()
    })

    it('fills a new step with the defaults the schema declares', async () => {
        await act(async () => {
            root.render(<Harness handlerConfig={null} />)
        })

        expect(form.getValues('handlerConfig')).toEqual({
            lookbackPeriods: 4,
            failOnEmpty: false,
            polling: { intervalSeconds: 30 },
        })
    })

    it('keeps the values of a saved step', async () => {
        const saved = { indicator: 'cholera', periodType: 'WEEKLY' }
        await act(async () => {
            root.render(<Harness handlerConfig={saved} />)
        })

        // Fields the step leaves out stay unset (sent as JSON, undefined keys drop out)
        expect(form.getValues('handlerConfig')).toEqual(saved)
        expect(form.getValues('handlerConfig')?.polling).toBeUndefined()
        expect(container.textContent).toContain('Add Polling')
    })

    it('draws a labelled input for every field', async () => {
        await act(async () => {
            root.render(<Harness handlerConfig={null} />)
        })

        const text = container.textContent ?? ''
        for (const label of [
            'EWARS indicator',
            'The indicator to fetch.',
            'Period type',
            'Lookback periods',
            'Fail on empty',
            'Locations',
            'Polling',
            'Interval seconds',
        ]) {
            expect(text).toContain(label)
        }
        expect(
            container.querySelector<HTMLInputElement>(
                'input[name="handlerConfig.lookbackPeriods"]'
            )?.value
        ).toBe('4')
    })
})
