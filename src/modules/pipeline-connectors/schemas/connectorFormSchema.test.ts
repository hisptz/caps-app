import {
    defaultConnectorFormValues,
    connectorFormSchema,
    connectorFormValuesToCreateBody,
    connectorFormValuesToUpdateBody,
    connectorToFormValues,
    type ConnectorFormValues,
} from './connectorFormSchema'
import type { PipelineConnector } from '@/shared/types/caps'

const TARGET = '22222222-2222-4111-8111-222222222222'
const OTHERWISE = '33333333-3333-4111-8111-333333333333'
const COUNT_ROW = {
    path: 'step_0_output.count',
    operator: 'gt' as const,
    value: '0',
}

function values(
    overrides: Partial<ConnectorFormValues> = {}
): ConnectorFormValues {
    return {
        ...defaultConnectorFormValues,
        name: 'Notify',
        targetPipelineId: TARGET,
        ...overrides,
    }
}

function issuePaths(input: ConnectorFormValues): string[] {
    const result = connectorFormSchema.safeParse(input)
    return result.success
        ? []
        : result.error.issues.map((issue) => issue.path.join('.'))
}

function connector(
    overrides: Partial<PipelineConnector> = {}
): PipelineConnector {
    return {
        id: 'connector-1',
        name: 'Notify',
        description: null,
        sourcePipelineId: 'source',
        targetPipelineId: TARGET,
        otherwisePipelineId: null,
        on: 'COMPLETED',
        condition: null,
        inputMapping: {},
        delayMinutes: 0,
        isActive: true,
        createdAt: '2026-10-29T00:00:00Z',
        updatedAt: '2026-10-29T00:00:00Z',
        ...overrides,
    }
}

describe('connectorFormSchema', () => {
    it('accepts the minimal form', () => {
        expect(issuePaths(values())).toEqual([])
    })

    it('requires a name and a target', () => {
        expect(issuePaths(values({ name: ' ', targetPipelineId: '' }))).toEqual(
            ['name', 'targetPipelineId']
        )
    })

    it('limits the delay to whole minutes up to 7 days', () => {
        expect(issuePaths(values({ delayMinutes: '1.5' }))).toEqual([
            'delayMinutes',
        ])
        expect(issuePaths(values({ delayMinutes: '10081' }))).toEqual([
            'delayMinutes',
        ])
        expect(issuePaths(values({ delayMinutes: '' }))).toEqual([
            'delayMinutes',
        ])
        expect(issuePaths(values({ delayMinutes: '10080' }))).toEqual([])
    })

    it('needs at least one condition in conditions mode', () => {
        expect(issuePaths(values({ ruleMode: 'conditions' }))).toEqual([
            'ruleConditions',
        ])
    })

    it('needs a value, and a number for ordering operators', () => {
        expect(
            issuePaths(
                values({
                    ruleMode: 'conditions',
                    ruleConditions: [
                        { path: 'a', operator: 'eq', value: '' },
                        { path: 'b', operator: 'gt', value: 'many' },
                        { path: 'c', operator: 'lt', value: '3' },
                    ],
                })
            )
        ).toEqual(['ruleConditions.0.value', 'ruleConditions.1.value'])
    })

    it('rejects a step picked without a result', () => {
        expect(
            issuePaths(
                values({
                    ruleMode: 'conditions',
                    ruleConditions: [
                        {
                            path: 'stepOutputs.s0.',
                            operator: 'gt',
                            value: '0',
                        },
                    ],
                })
            )
        ).toEqual(['ruleConditions.0.path'])
    })

    it('rejects an otherwise pipeline that is the pipeline to start', () => {
        expect(
            issuePaths(
                values({
                    ruleMode: 'conditions',
                    ruleConditions: [COUNT_ROW],
                    otherwisePipelineId: TARGET,
                })
            )
        ).toEqual(['otherwisePipelineId'])
    })

    it('rejects bad and duplicate mapping targets', () => {
        expect(
            issuePaths(
                values({
                    inputMappings: [
                        { target: 'steps..x', source: 'a' },
                        { target: 'a.__proto__', source: 'a' },
                        { target: 'count', source: 'a' },
                        { target: 'count', source: 'b' },
                    ],
                })
            )
        ).toEqual([
            'inputMappings.0.target',
            'inputMappings.1.target',
            'inputMappings.3.target',
        ])
    })
})

describe('connector <-> form values', () => {
    it('builds a create body from conditions and mappings', () => {
        const body = connectorFormValuesToCreateBody(
            values({
                on: 'FINISHED',
                delayMinutes: '30',
                ruleMode: 'conditions',
                ruleConditions: [
                    { path: 'step_0_output.count', operator: 'gt', value: '0' },
                ],
                inputMappings: [
                    {
                        target: ' steps.abc.orgUnits ',
                        source: 'step_0_output.orgUnits',
                    },
                ],
            }),
            'source'
        )
        expect(body).toEqual({
            name: 'Notify',
            description: undefined,
            sourcePipelineId: 'source',
            targetPipelineId: TARGET,
            otherwisePipelineId: null,
            on: 'FINISHED',
            condition: { '>': [{ var: 'context.step_0_output.count' }, 0] },
            inputMapping: { 'steps.abc.orgUnits': 'step_0_output.orgUnits' },
            delayMinutes: 30,
            isActive: true,
        })
    })

    it('sends the otherwise pipeline only behind a condition', () => {
        const withCondition = values({
            ruleMode: 'conditions',
            ruleConditions: [COUNT_ROW],
            otherwisePipelineId: OTHERWISE,
        })
        expect(
            connectorFormValuesToUpdateBody(withCondition).otherwisePipelineId
        ).toBe(OTHERWISE)
        expect(
            connectorFormValuesToUpdateBody({
                ...withCondition,
                ruleMode: 'always',
            }).otherwisePipelineId
        ).toBeNull()
        expect(
            connectorFormValuesToCreateBody(
                { ...withCondition, otherwisePipelineId: '' },
                'source'
            ).otherwisePipelineId
        ).toBeNull()
    })

    it('opens a connector with its otherwise pipeline', () => {
        expect(
            connectorToFormValues(connector({ otherwisePipelineId: OTHERWISE }))
                .otherwisePipelineId
        ).toBe(OTHERWISE)
        expect(connectorToFormValues(connector()).otherwisePipelineId).toBe('')
    })

    it('clears the rule when switched back to always', () => {
        expect(
            connectorFormValuesToUpdateBody(
                values({ ruleMode: 'always', ruleJson: '{"!!":[1]}' })
            ).condition
        ).toBeNull()
    })

    it('opens a builder-shaped rule in conditions mode', () => {
        const form = connectorToFormValues(
            connector({
                condition: { '>': [{ var: 'context.step_0_output.count' }, 0] },
                inputMapping: { target: 'source.path' },
                delayMinutes: 60,
            })
        )
        expect(form).toMatchObject({
            ruleMode: 'conditions',
            ruleConditions: [
                { path: 'step_0_output.count', operator: 'gt', value: '0' },
            ],
            inputMappings: [{ target: 'target', source: 'source.path' }],
            delayMinutes: '60',
        })
    })

    it('keeps a mapping set through the API when the connector is saved here', () => {
        const mapping = { 'steps.abc.period': 'steps.xyz.period' }
        const form = connectorToFormValues(connector({ inputMapping: mapping }))
        expect(connectorFormValuesToUpdateBody(form).inputMapping).toEqual(
            mapping
        )
    })

    it('keeps a rule the pickers cannot show, untouched', () => {
        const condition = {
            '>': [{ var: 'context.stepOutputs.s0.filename' }, 0],
        }
        const form = connectorToFormValues(
            connector({ condition }),
            () => false
        )
        expect(form.ruleMode).toBe('json')
        expect(connectorFormValuesToUpdateBody(form).condition).toEqual(
            condition
        )
    })

    it('opens a hand-written rule in JSON mode without losing it', () => {
        const condition = { '==': [{ var: 'status' }, 'FAILED'] }
        const form = connectorToFormValues(connector({ condition }))
        expect(form.ruleMode).toBe('json')
        expect(JSON.parse(form.ruleJson)).toEqual(condition)
        expect(connectorFormValuesToUpdateBody(form).condition).toEqual(
            condition
        )
    })
})
