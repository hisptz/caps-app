import {
    describeOutputPath,
    parseStepOutputPath,
    rowsArePickable,
    stepOutputFields,
    stepOutputPath,
} from './stepOutputs'
import type { HandlerDescriptor } from '@/capsApi/types'
import type { PipelineStep } from '@/shared/types/caps'

function step(name: string, handlerKey: string): PipelineStep {
    return {
        id: name,
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

const handlers: HandlerDescriptor[] = [
    {
        key: 'pull',
        displayName: 'Pull',
        description: '',
        tags: [],
        queueName: 'step.pull',
        outputs: {
            fields: [
                { key: 'count', label: 'Values pulled', type: 'number' },
                { key: 'skipped', label: 'Values skipped', type: 'number' },
            ],
        },
    },
    {
        key: 'notify',
        displayName: 'Notify',
        description: '',
        tags: [],
        queueName: 'step.notify',
        outputs: { passThrough: true },
    },
    {
        key: 'old',
        displayName: 'Old engine handler',
        description: '',
        tags: [],
        queueName: 'step.old',
    },
]

const steps = [
    step('Pull data', 'pull'),
    step('Notify', 'notify'),
    step('Legacy', 'old'),
]

describe('step output paths', () => {
    it('builds the step-id form', () => {
        expect(stepOutputPath('step-a', 'count')).toBe(
            'stepOutputs.step-a.count'
        )
    })

    it('finds the step by id, including a half-finished path', () => {
        expect(parseStepOutputPath('stepOutputs.Notify.count', steps)).toEqual({
            stepIndex: 1,
            field: 'count',
            byPosition: false,
        })
        expect(parseStepOutputPath('stepOutputs.Notify.', steps)).toEqual({
            stepIndex: 1,
            field: '',
            byPosition: false,
        })
        expect(
            parseStepOutputPath('stepOutputs.deleted-step.count', steps)
                ?.stepIndex
        ).toBe(-1)
    })

    it('still reads older position paths', () => {
        expect(parseStepOutputPath('step_0_output.a.b', steps)).toEqual({
            stepIndex: 0,
            field: 'a.b',
            byPosition: true,
        })
        expect(parseStepOutputPath('step_9_output.x', steps)?.stepIndex).toBe(
            -1
        )
    })

    it('does not place other context paths', () => {
        expect(parseStepOutputPath('scheduledAt', steps)).toBeNull()
    })
})

describe('stepOutputFields', () => {
    it('lists a step’s declared fields', () => {
        expect(stepOutputFields(steps, 0, handlers)?.map((f) => f.key)).toEqual(
            ['count', 'skipped']
        )
    })

    it('follows a pass-through step to the step before it', () => {
        expect(stepOutputFields(steps, 1, handlers)?.[0]?.label).toBe(
            'Values pulled'
        )
    })

    it('says nothing (null) when the engine does not describe the handler', () => {
        expect(stepOutputFields(steps, 2, handlers)).toBeNull()
    })

    it('has no fields for a pass-through first step', () => {
        expect(
            stepOutputFields([step('Notify', 'notify')], 0, handlers)
        ).toEqual([])
    })
})

describe('describeOutputPath', () => {
    it('names the step and the result', () => {
        expect(
            describeOutputPath('stepOutputs.Pull data.count', steps, handlers)
        ).toEqual({ label: 'Pull data → Values pulled', type: 'number' })
        expect(
            describeOutputPath('step_0_output.count', steps, handlers).label
        ).toBe('Pull data → Values pulled')
    })

    it('falls back to the field name or the raw path', () => {
        expect(
            describeOutputPath('step_0_output.unknown', steps, handlers).label
        ).toBe('Pull data → unknown')
        expect(describeOutputPath('scheduledAt', steps, handlers).label).toBe(
            'scheduledAt'
        )
    })
})

describe('rowsArePickable', () => {
    it('accepts rows that point at listed counts', () => {
        expect(
            rowsArePickable(
                [
                    {
                        path: 'stepOutputs.Pull data.count',
                        operator: 'gt',
                        value: '0',
                    },
                    // Older position paths too
                    {
                        path: 'step_0_output.skipped',
                        operator: 'eq',
                        value: '0',
                    },
                ],
                steps,
                handlers
            )
        ).toBe(true)
    })

    it('rejects unlisted results and unknown steps', () => {
        const check = (path: string) =>
            rowsArePickable(
                [{ path, operator: 'gt', value: '0' }],
                steps,
                handlers
            )
        expect(check('stepOutputs.Pull data.filename')).toBe(false)
        expect(check('stepOutputs.deleted.count')).toBe(false)
        expect(check('scheduledAt')).toBe(false)
    })
})
