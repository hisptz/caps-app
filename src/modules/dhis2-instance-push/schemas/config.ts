import i18n from '@dhis2/d2-i18n'
import { z } from 'zod'
import { SOURCE_ROUTE_CODE_PATTERN } from '@/modules/connected-instances/constants'
import { dataValueImportStrategySchema } from '@/modules/dhis2-data-upload/schemas/config'
import {
    fixedPullPeriodSchema,
    orgUnitMatchSchema,
    relativePullPeriodSchema,
} from '@/modules/dhis2-instance-pull/schemas/config'

export const DHIS2_INSTANCE_PUSH_HANDLER = 'dhis2-instance-push'

const uidSchema = z.string().regex(/^[A-Za-z][A-Za-z0-9]{10}$/, {
    message: i18n.t('Must be a DHIS2 ID'),
})

export const pushItemSchema = z.object({
    /** Data element on staging to read values from. */
    from: uidSchema,
    /** Data element on the target instance; the same ID as `from` when left out. */
    into: uidSchema.optional(),
})

export type PushItem = z.infer<typeof pushItemSchema>

export function pushItemTarget(item: Partial<PushItem>): string | undefined {
    return item.into || item.from || undefined
}

/** Values stored or changed on staging in the last `days` days, whatever their period. */
export const updatedPushPeriodSchema = z.object({
    mode: z.literal('updated'),
    days: z.number().int().min(1).max(366),
})

export const pushPeriodSchema = z.discriminatedUnion('mode', [
    updatedPushPeriodSchema,
    fixedPullPeriodSchema,
    relativePullPeriodSchema,
])

export type PushPeriod = z.infer<typeof pushPeriodSchema>

/** Raw data values as entered, or totals rolled up by staging's analytics. */
export const pushSourceSchema = z.enum(['raw', 'analytics'])

export type PushSource = z.infer<typeof pushSourceSchema>

export const PUSH_CHUNK_MIN = 100
export const PUSH_CHUNK_MAX = 10_000

/** Mirrors caps-engine worker `dhis2InstancePushConfigSchema`. */
export const dhis2InstancePushConfigSchema = z.object({
    routeCode: z.string().regex(SOURCE_ROUTE_CODE_PATTERN, {
        message: i18n.t('Pick a connected instance'),
    }),
    items: z
        .array(pushItemSchema)
        .min(1, { message: i18n.t('Add at least one data element to push') }),
    source: pushSourceSchema.default('raw'),
    /** Staging org units whose values are sent. */
    orgUnit: z.object({
        ids: z.array(z.string()).optional(),
        levels: z.array(z.number().int().positive()).optional(),
        groups: z.array(z.string()).optional(),
    }),
    orgUnitMatch: orgUnitMatchSchema.default('id'),
    period: pushPeriodSchema,
    importStrategy: dataValueImportStrategySchema.default('CREATE_AND_UPDATE'),
    chunk: z
        .object({
            orgUnits: z.number().int().min(1).max(500).default(50),
            periods: z.number().int().min(1).max(60).default(12),
            values: z
                .number()
                .int()
                .min(PUSH_CHUNK_MIN)
                .max(PUSH_CHUNK_MAX)
                .default(2_000),
        })
        .default({ orgUnits: 50, periods: 12, values: 2_000 }),
})

export type Dhis2InstancePushConfigValue = z.infer<
    typeof dhis2InstancePushConfigSchema
>

export function defaultDhis2InstancePushConfig(): Dhis2InstancePushConfigValue {
    return {
        routeCode: '',
        items: [],
        source: 'raw',
        orgUnit: { levels: [] },
        orgUnitMatch: 'id',
        period: { mode: 'updated', days: 7 },
        importStrategy: 'CREATE_AND_UPDATE',
        chunk: { orgUnits: 50, periods: 12, values: 2_000 },
    }
}

export function isDhis2InstancePushConfigShape(value: unknown): boolean {
    return (
        typeof value === 'object' &&
        value !== null &&
        Array.isArray((value as { items?: unknown }).items) &&
        typeof (value as { period?: unknown }).period === 'object'
    )
}
