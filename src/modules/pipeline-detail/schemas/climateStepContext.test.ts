import type { HandlerDescriptor } from '@/capsApi/types'
import { buildDefaultStepContexts } from '@/modules/handlers/utils/contextCapableSteps'
import { clearHandlerContextSchemaMemo } from '@/modules/handlers/utils/handlerContextSchemas'
import { createPipelineContextFormSchema } from '@/modules/pipeline-detail/schemas/pipelineContextFormSchema'
import {
    buildScheduleFormDefaults,
    createScheduleFormSchema,
    scheduleToFormValues,
} from '@/modules/pipeline-detail/schemas/scheduleFormSchema'
import {
    climateContextPeriodIssue,
    describePeriod,
} from '@/shared/components/HandlerConfigForms/ClimateOpenEoCreateConfig/utils/climatePeriod'
import {
    schedulePullPeriod,
    schedulePullPeriodIssue,
} from '@/shared/components/HandlerConfigForms/Dhis2InstancePullConfig/schedulePeriod'
import type { PipelineSchedule, PipelineStep } from '@/shared/types/caps'

// The context schema caps-engine publishes for climate-openeo-create: period and org units optional.
// Schedules additionally refuse a fixed range, which the app checks (scheduleFormSchema).
const contextSchema = {
    type: 'object',
    properties: {
        period: {
            anyOf: [
                {
                    type: 'object',
                    properties: {
                        mode: {
                            type: 'string',
                            const: 'fixed',
                        },
                        periodType: {
                            type: 'string',
                            enum: ['daily', 'weekly', 'monthly'],
                        },
                        id: {
                            type: 'string',
                            minLength: 1,
                        },
                        endId: {
                            type: 'string',
                            minLength: 1,
                        },
                    },
                    required: ['periodType', 'id'],
                    additionalProperties: false,
                },
                {
                    type: 'object',
                    properties: {
                        mode: {
                            type: 'string',
                            const: 'rolling',
                        },
                        periodType: {
                            type: 'string',
                            enum: ['daily', 'weekly', 'monthly'],
                        },
                        count: {
                            type: 'integer',
                            minimum: 1,
                            maximum: 9007199254740991,
                        },
                        offset: {
                            type: 'integer',
                            minimum: 0,
                            maximum: 366,
                        },
                    },
                    required: ['mode', 'periodType', 'count'],
                    additionalProperties: false,
                },
                {
                    type: 'object',
                    properties: {
                        periodType: {
                            type: 'string',
                            const: 'daily',
                        },
                        lastDays: {
                            type: 'integer',
                            minimum: 1,
                            maximum: 9007199254740991,
                        },
                    },
                    required: ['periodType', 'lastDays'],
                    additionalProperties: false,
                },
            ],
        },
        orgUnit: {
            type: 'object',
            properties: {
                levels: {
                    type: 'array',
                    items: {
                        type: 'string',
                    },
                },
                ids: {
                    type: 'array',
                    items: {
                        type: 'string',
                    },
                },
            },
        },
    },
}

const handlers: HandlerDescriptor[] = [
    {
        key: 'climate-openeo-create',
        displayName: 'Open Climate Service Create',
        description: 'Test handler',
        tags: [],
        queueName: 'step.climate-openeo-create',
        schemas: { context: contextSchema },
    } as HandlerDescriptor,
]

const rollingStepPeriod = {
    mode: 'rolling',
    periodType: 'daily',
    count: 35,
    offset: 1,
}

const step = {
    id: 'step-1',
    handlerKey: 'climate-openeo-create',
    stepOrder: 1,
    name: 'Aggregate precipitation',
    handlerConfig: {
        datasetId: 'chirps3_precipitation_daily',
        variable: { dataElement: 'QRvJclmKq2g' },
        aggregation: { method: 'mean' },
        period: rollingStepPeriod,
        orgUnit: { levels: ['2'] },
    },
} as unknown as PipelineStep

function scheduleIssues(context: Record<string, unknown>) {
    const result = createScheduleFormSchema([step], handlers).safeParse({
        name: 'Weekly',
        cronExpression: '0 3 * * 1',
        stepContexts: { 'step-1': context },
    })
    return result.success
        ? []
        : result.error.issues.map((i) => [i.path.join('.'), i.message])
}

const fixedStep = {
    ...step,
    id: 'step-2',
    handlerConfig: {
        ...step.handlerConfig,
        period: { periodType: 'monthly', id: '202605', endId: '202607' },
    },
} as unknown as PipelineStep

function scheduleWith(context: Record<string, unknown>): PipelineSchedule {
    return {
        id: 'sched-1',
        pipelineId: 'pipe-1',
        name: 'Weekly',
        status: 'ACTIVE',
        cronExpr: '0 3 * * 1',
        inputContext: { steps: { 'step-1': context } },
    } as unknown as PipelineSchedule
}

describe("climate step on schedules: step's period or latest periods", () => {
    beforeEach(() => clearHandlerContextSchemaMemo())

    it('follows a rolling step, and gives a fixed step latest periods of its own', () => {
        expect(
            buildScheduleFormDefaults([step, fixedStep], handlers).stepContexts
        ).toEqual({
            'step-1': {},
            'step-2': {
                period: {
                    mode: 'rolling',
                    periodType: 'monthly',
                    count: 3,
                    offset: 1,
                },
            },
        })
    })

    it("accepts the step's period or latest periods, with or without org units", () => {
        const period = { mode: 'rolling', periodType: 'daily', count: 7 }
        expect(scheduleIssues({})).toEqual([])
        expect(scheduleIssues({ orgUnit: { levels: ['3'] } })).toEqual([])
        expect(scheduleIssues({ period })).toEqual([])
    })

    it('refuses a fixed range, and checks latest periods', () => {
        expect(
            scheduleIssues({
                period: { periodType: 'daily', id: '20260101' },
            })[0]
        ).toEqual([
            'stepContexts.step-1.period.count',
            'Scheduled runs use the step’s period or latest periods, not a fixed range',
        ])
        expect(
            scheduleIssues({
                period: { mode: 'rolling', periodType: 'daily' },
            })[0]
        ).toEqual([
            'stepContexts.step-1.period.count',
            'Enter how many periods to cover',
        ])
    })

    it('drops copies of the step from older schedules', () => {
        expect(
            scheduleToFormValues(
                scheduleWith({
                    period: rollingStepPeriod,
                    orgUnit: { levels: ['2'] },
                }),
                [step]
            ).stepContexts
        ).toEqual({ 'step-1': {} })
    })

    it("turns an older schedule's fixed range into latest periods", () => {
        expect(
            scheduleToFormValues(
                scheduleWith({
                    period: { periodType: 'daily', id: '20260101' },
                }),
                [step]
            ).stepContexts
        ).toEqual({ 'step-1': { period: rollingStepPeriod } })
    })

    it("keeps a schedule's own latest periods", () => {
        const ownPeriod = {
            mode: 'rolling',
            periodType: 'daily',
            count: 70,
            offset: 30,
        }
        expect(
            scheduleToFormValues(scheduleWith({ period: ownPeriod }), [step])
                .stepContexts
        ).toEqual({ 'step-1': { period: ownPeriod } })
    })
})

describe('instance pull on schedules', () => {
    it("refuses a fixed range and accepts the step's or latest periods", () => {
        expect(schedulePullPeriodIssue({})).toBeNull()
        expect(
            schedulePullPeriodIssue({
                period: {
                    mode: 'relative',
                    periodType: 'MONTHLY',
                    count: 3,
                    offset: 1,
                },
            })
        ).toBeNull()
        expect(
            schedulePullPeriodIssue({
                period: {
                    mode: 'fixed',
                    periodType: 'MONTHLY',
                    start: '202401',
                    end: '202412',
                },
            })?.path
        ).toEqual(['period', 'mode'])
    })

    it("starts latest periods from the step's own, or three months", () => {
        expect(
            schedulePullPeriod({
                mode: 'relative',
                periodType: 'WEEKLY',
                count: 8,
                offset: 2,
            })
        ).toEqual({
            mode: 'relative',
            periodType: 'WEEKLY',
            count: 8,
            offset: 2,
        })
        expect(
            schedulePullPeriod({ mode: 'fixed', periodType: 'MONTHLY' })
        ).toEqual({
            mode: 'relative',
            periodType: 'MONTHLY',
            count: 3,
            offset: 1,
        })
    })
})

describe('climate step on manual runs', () => {
    beforeEach(() => clearHandlerContextSchemaMemo())

    it('starts with no override, so the run follows the step', () => {
        expect(buildDefaultStepContexts([step], handlers)).toEqual({
            'step-1': {},
        })
    })

    it('puts period messages on the override field', () => {
        const result = createPipelineContextFormSchema(
            [step],
            handlers
        ).safeParse({
            stepContexts: { 'step-1': { period: { periodType: 'daily' } } },
        })
        expect(
            result.success
                ? []
                : result.error.issues.map((i) => i.path.join('.'))
        ).toContain('stepContexts.step-1.period.id')
    })
})

describe('climateContextPeriodIssue', () => {
    it('is fine without a period', () => {
        expect(climateContextPeriodIssue({})).toBeNull()
    })
})

describe('describePeriod', () => {
    it('sums up rolling and fixed periods', () => {
        expect(describePeriod(rollingStepPeriod)).toBe(
            'Latest periods: the last 35 complete days'
        )
        expect(
            describePeriod({
                mode: 'rolling',
                periodType: 'daily',
                count: 40,
                offset: 30,
            })
        ).toBe('Latest periods: 40 days, skipping the most recent 30')
        expect(describePeriod({ periodType: 'daily', lastDays: 70 })).toBe(
            'Latest periods: the last 70 complete days'
        )
        expect(
            describePeriod({
                periodType: 'monthly',
                id: '202605',
                endId: '202607',
            })
        ).toBe('Fixed range: 202605 to 202607')
        expect(describePeriod({ periodType: 'monthly' })).toBeUndefined()
    })
})
