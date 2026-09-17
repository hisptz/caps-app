import {
    createScheduleFormSchema,
    scheduleFormValuesToCreateBody,
    scheduleFormValuesToUpdateBody,
    scheduleToFormValues,
} from '@/modules/pipeline-detail/schemas/scheduleFormSchema'
import type { PipelineSchedule } from '@/shared/types/caps'

const baseSchedule: PipelineSchedule = {
    id: 'sched-1',
    pipelineId: 'pipe-1',
    name: 'Daily run',
    description: 'Morning batch',
    status: 'ACTIVE',
    cronExpr: '0 2 * * *',
    inputContext: {
        steps: { 'step-a': { orgUnit: 'abc' } },
    },
    lastRunAt: null,
    nextRunAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
}

describe('scheduleToFormValues', () => {
    it('maps cron schedule fields and stored step contexts', () => {
        expect(scheduleToFormValues(baseSchedule)).toEqual({
            name: 'Daily run',
            description: 'Morning batch',
            cronExpression: '0 2 * * *',
            stepContexts: { 'step-a': { orgUnit: 'abc' } },
        })
    })
})

describe('scheduleFormValuesToUpdateBody', () => {
    it('includes cronExpr for updates', () => {
        const values = scheduleToFormValues(baseSchedule)
        expect(scheduleFormValuesToUpdateBody(values)).toMatchObject({
            name: 'Daily run',
            description: 'Morning batch',
            cronExpr: '0 2 * * *',
            inputContext: { steps: { 'step-a': { orgUnit: 'abc' } } },
        })
    })
})

describe('scheduleFormValuesToCreateBody', () => {
    it('maps create payload from form values', () => {
        const values = scheduleToFormValues(baseSchedule)
        expect(scheduleFormValuesToCreateBody(values)).toEqual({
            name: 'Daily run',
            description: 'Morning batch',
            cronExpr: '0 2 * * *',
            inputContext: { steps: { 'step-a': { orgUnit: 'abc' } } },
        })
    })

    it('does not send type, intervalMs, or runAt', () => {
        const body = scheduleFormValuesToCreateBody(
            scheduleToFormValues(baseSchedule)
        )
        expect(body).not.toHaveProperty('type')
        expect(body).not.toHaveProperty('intervalMs')
        expect(body).not.toHaveProperty('runAt')
    })
})

describe('createScheduleFormSchema', () => {
    const schema = createScheduleFormSchema([], [])

    it('requires a cron expression', () => {
        const result = schema.safeParse({
            name: 'Daily run',
            description: '',
            cronExpression: '',
            stepContexts: {},
        })
        expect(result.success).toBe(false)
        if (!result.success) {
            expect(
                result.error.issues.some((i) => i.path[0] === 'cronExpression')
            ).toBe(true)
        }
    })

    it('accepts a cron-only form', () => {
        const result = schema.safeParse({
            name: 'Daily run',
            description: '',
            cronExpression: '0 6 * * *',
            stepContexts: {},
        })
        expect(result.success).toBe(true)
    })
})
