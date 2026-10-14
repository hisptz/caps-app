import {
    climatePeriodIssue,
    fixedPeriodFrom,
    lastDayOfPeriod,
    periodForMode,
    periodModeOf,
    rollingFieldsOf,
    rollingWindow,
} from './climatePeriod'
import type { HandlerDescriptor } from '@/capsApi/types'
import { clearHandlerConfigSchemaMemo } from '@/modules/handlers/utils/handlerConfigSchemas'
import { createPipelineStepFormSchema } from '@/modules/pipeline-detail/schemas/stepFormSchema'

describe('periodModeOf', () => {
    it('reads fixed, rolling and the earlier lastDays form', () => {
        expect(periodModeOf({ periodType: 'monthly', id: '202605' })).toBe(
            'fixed'
        )
        expect(periodModeOf(undefined)).toBe('fixed')
        expect(
            periodModeOf({ mode: 'rolling', periodType: 'daily', count: 35 })
        ).toBe('rolling')
        expect(periodModeOf({ periodType: 'daily', lastDays: 35 })).toBe(
            'rolling'
        )
    })
})

describe('rollingFieldsOf', () => {
    it('reads lastDays as a count ending yesterday', () => {
        expect(rollingFieldsOf({ periodType: 'daily', lastDays: 70 })).toEqual({
            count: 70,
            offset: 1,
        })
    })

    it('defaults the offset to 1', () => {
        expect(
            rollingFieldsOf({
                mode: 'rolling',
                periodType: 'monthly',
                count: 3,
            })
        ).toEqual({ count: 3, offset: 1 })
    })
})

describe('fixedPeriodFrom', () => {
    it('drops rolling fields so a run override never mixes them', () => {
        expect(
            fixedPeriodFrom({
                mode: 'rolling',
                periodType: 'daily',
                count: 35,
                offset: 1,
            })
        ).toEqual({ periodType: 'daily' })
        expect(fixedPeriodFrom({ periodType: 'daily', lastDays: 35 })).toEqual({
            periodType: 'daily',
        })
    })
})

describe('periodForMode', () => {
    it('starts a rolling period with defaults for the period type', () => {
        expect(periodForMode('rolling', 'monthly')).toEqual({
            mode: 'rolling',
            periodType: 'monthly',
            count: 3,
            offset: 1,
        })
    })

    it('starts a fixed period with only its type', () => {
        expect(periodForMode('fixed', 'daily')).toEqual({ periodType: 'daily' })
    })
})

// Same cases as caps-engine's temporalExtentFromPeriod tests, so the preview matches a run.
describe('lastDayOfPeriod', () => {
    it.each([
        { date: '2026-09-01', periodType: 'monthly', end: '2026-09-30' },
        { date: '2024-02-01', periodType: 'monthly', end: '2024-02-29' },
        { date: '2026-09-21', periodType: 'weekly', end: '2026-09-27' },
        { date: '2026-09-23', periodType: 'weekly', end: '2026-09-27' },
        { date: '2026-09-23', periodType: 'daily', end: '2026-09-23' },
    ] as const)(
        '$periodType step $date ends $end',
        ({ date, periodType, end }) => {
            expect(lastDayOfPeriod(date, periodType)).toBe(end)
        }
    )

    it('ignores a date it cannot read', () => {
        expect(lastDayOfPeriod('soon', 'monthly')).toBeUndefined()
    })
})

describe('rollingWindow', () => {
    const now = new Date('2026-10-09T13:00:00Z')

    it.each([
        {
            periodType: 'daily',
            count: 35,
            offset: 1,
            window: ['2026-09-04', '2026-10-08'],
        },
        {
            periodType: 'daily',
            count: 40,
            offset: 30,
            window: ['2026-08-01', '2026-09-09'],
        },
        {
            periodType: 'monthly',
            count: 3,
            offset: 1,
            window: ['2026-07-01', '2026-09-30'],
        },
        {
            periodType: 'weekly',
            count: 2,
            offset: 1,
            window: ['2026-09-21', '2026-10-04'],
        },
        {
            periodType: 'monthly',
            count: 1,
            offset: 0,
            window: ['2026-10-01', '2026-10-31'],
        },
    ] as const)(
        '$periodType, count $count, offset $offset',
        ({ window, ...rolling }) => {
            expect(rollingWindow(rolling, now)).toEqual(window)
        }
    )

    it('crosses a year boundary', () => {
        expect(
            rollingWindow(
                { periodType: 'monthly', count: 2, offset: 1 },
                new Date('2026-01-15T00:00:00Z')
            )
        ).toEqual(['2025-11-01', '2025-12-31'])
    })
})

describe('climatePeriodIssue', () => {
    it('asks for a start period in fixed mode', () => {
        expect(climatePeriodIssue({ periodType: 'monthly' })?.path).toEqual([
            'id',
        ])
        expect(
            climatePeriodIssue({ periodType: 'monthly', id: '202605' })
        ).toBeNull()
    })

    it('checks the rolling count and offset', () => {
        expect(
            climatePeriodIssue({ mode: 'rolling', periodType: 'daily' })?.path
        ).toEqual(['count'])
        expect(
            climatePeriodIssue({
                mode: 'rolling',
                periodType: 'monthly',
                count: 37,
            })?.message
        ).toBe('At most 36')
        expect(
            climatePeriodIssue({
                mode: 'rolling',
                periodType: 'daily',
                count: 5,
                offset: -1,
            })?.path
        ).toEqual(['offset'])
        expect(
            climatePeriodIssue({
                mode: 'rolling',
                periodType: 'daily',
                count: 35,
            })
        ).toBeNull()
        expect(
            climatePeriodIssue({ periodType: 'daily', lastDays: 401 })?.path
        ).toEqual(['lastDays'])
    })
})

// The config schema caps-engine publishes for climate-openeo-create (fixed | rolling | lastDays).
const configSchema = {
    type: 'object',
    properties: {
        datasetId: {
            type: 'string',
            minLength: 1,
        },
        exportId: {
            type: 'string',
            pattern: '^[A-Za-z0-9][A-Za-z0-9_-]*$',
        },
        variable: {
            type: 'object',
            properties: {
                dataElement: {
                    type: 'string',
                    pattern: '^[A-Za-z0-9]{11}$',
                },
            },
            required: ['dataElement'],
        },
        aggregation: {
            type: 'object',
            properties: {
                method: {
                    type: 'string',
                    enum: ['mean', 'min', 'max', 'sum'],
                },
            },
            required: ['method'],
        },
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
    required: ['datasetId', 'aggregation', 'period', 'orgUnit'],
}

const handlers: HandlerDescriptor[] = [
    {
        key: 'climate-openeo-create',
        displayName: 'Open Climate Service Create',
        description: 'Test handler',
        tags: [],
        queueName: 'step.climate-openeo-create',
        schemas: { config: configSchema },
    } as HandlerDescriptor,
]

function stepIssues(period: Record<string, unknown>) {
    const result = createPipelineStepFormSchema(handlers).safeParse({
        stepOrder: 0,
        name: 'Aggregate precipitation',
        handlerKey: 'climate-openeo-create',
        handlerConfig: {
            datasetId: 'chirps3_precipitation_daily',
            variable: { dataElement: 'QRvJclmKq2g' },
            aggregation: { method: 'mean' },
            orgUnit: { levels: ['2'] },
            period,
        },
    })
    return result.success
        ? []
        : result.error.issues.map((i) => [i.path.join('.'), i.message])
}

describe('step form with the published climate period schema', () => {
    beforeEach(() => clearHandlerConfigSchemaMemo())

    it('saves fixed, rolling and lastDays periods', () => {
        expect(stepIssues({ periodType: 'monthly', id: '202605' })).toEqual([])
        expect(
            stepIssues({
                mode: 'rolling',
                periodType: 'daily',
                count: 35,
                offset: 1,
            })
        ).toEqual([])
        expect(stepIssues({ periodType: 'daily', lastDays: 35 })).toEqual([])
    })

    it('puts the message on the missing field', () => {
        expect(stepIssues({ periodType: 'monthly' })[0]).toEqual([
            'handlerConfig.period.id',
            'Select a start period',
        ])
        expect(stepIssues({ mode: 'rolling', periodType: 'daily' })[0]).toEqual(
            ['handlerConfig.period.count', 'Enter how many periods to cover']
        )
    })

    it('refuses a period mixing fixed and rolling fields', () => {
        expect(
            stepIssues({ periodType: 'daily', id: '20260101', lastDays: 35 })
        ).not.toEqual([])
    })
})
