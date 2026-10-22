import type { HandlerDescriptor } from '@/capsApi/types'
import {
    describePushPeriod,
    schedulePushPeriodIssue,
} from '@/modules/dhis2-instance-push/utils/schedulePeriod'
import { buildDefaultStepContexts } from '@/modules/handlers/utils/contextCapableSteps'
import type { PipelineStep } from '@/shared/types/caps'

describe('schedulePushPeriodIssue', () => {
    it('accepts no override, recently updated values and latest periods', () => {
        expect(schedulePushPeriodIssue({})).toBeNull()
        expect(
            schedulePushPeriodIssue({ period: { mode: 'updated', days: 7 } })
        ).toBeNull()
        expect(
            schedulePushPeriodIssue({
                period: {
                    mode: 'relative',
                    periodType: 'MONTHLY',
                    count: 3,
                    offset: 1,
                },
            })
        ).toBeNull()
    })

    it('rejects a fixed range for schedules', () => {
        expect(
            schedulePushPeriodIssue({
                period: {
                    mode: 'fixed',
                    periodType: 'MONTHLY',
                    start: '202401',
                    end: '202412',
                },
            })
        ).toMatchObject({ path: ['period', 'mode'] })
    })
})

describe('describePushPeriod', () => {
    it('summarises recently updated values', () => {
        expect(describePushPeriod({ mode: 'updated', days: 7 })).toMatch(/7/)
    })
})

describe('push step run context defaults', () => {
    it('starts empty, so runs follow the step’s own settings', () => {
        const handlers = [
            {
                key: 'dhis2-instance-push',
                schemas: { context: { type: 'object' } },
            },
        ] as unknown as HandlerDescriptor[]
        const steps = [
            {
                id: 'push-step',
                handlerKey: 'dhis2-instance-push',
                handlerConfig: { period: { mode: 'updated', days: 7 } },
            },
        ] as unknown as PipelineStep[]
        expect(buildDefaultStepContexts(steps, handlers)).toEqual({
            'push-step': {},
        })
    })
})
