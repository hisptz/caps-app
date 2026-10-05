import i18n from '@dhis2/d2-i18n'
import { z } from 'zod'
import { SOURCE_ROUTE_CODE_PATTERN } from '@/modules/connected-instances/constants'

const uidSchema = z.string().regex(/^[A-Za-z][A-Za-z0-9]{10}$/, {
    message: i18n.t('Must be a DHIS2 ID'),
})

export const pullPeriodTypeSchema = z.enum(['WEEKLY', 'MONTHLY'])

export type PullPeriodType = z.infer<typeof pullPeriodTypeSchema>

export const fixedPullPeriodSchema = z.object({
    mode: z.literal('fixed'),
    periodType: pullPeriodTypeSchema,
    start: z.string().min(1, { message: i18n.t('Pick a start period') }),
    end: z.string().min(1, { message: i18n.t('Pick an end period') }),
})

export type FixedPullPeriod = z.infer<typeof fixedPullPeriodSchema>

export const relativePullPeriodSchema = z.object({
    mode: z.literal('relative'),
    periodType: pullPeriodTypeSchema,
    count: z.number().int().min(1).max(260),
    offset: z.number().int().min(0).default(1),
})

export const pullPeriodSchema = z.discriminatedUnion('mode', [
    fixedPullPeriodSchema,
    relativePullPeriodSchema,
])

export type PullPeriod = z.infer<typeof pullPeriodSchema>

/** How destination org units are found on the source instance. */
export const orgUnitMatchSchema = z.enum(['id', 'code'])

export type OrgUnitMatch = z.infer<typeof orgUnitMatchSchema>

export const pullItemTypeSchema = z.enum([
    'DATA_ELEMENT',
    'INDICATOR',
    'PROGRAM_INDICATOR',
])

export type PullItemType = z.infer<typeof pullItemTypeSchema>

export const pullItemSchema = z.object({
    from: uidSchema,
    fromType: pullItemTypeSchema,
    into: uidSchema.optional(),
})

export type PullItem = z.infer<typeof pullItemSchema>

/**
 * Mirrors caps-engine worker `dhis2InstancePullConfigSchema`, except that `into` may be
 * missing on indicator rows until the step is saved (see `useCreateMissingDataElements`).
 */
export const dhis2InstancePullConfigSchema = z.object({
    routeCode: z.string().regex(SOURCE_ROUTE_CODE_PATTERN, {
        message: i18n.t('Pick a connected instance'),
    }),
    items: z
        .array(pullItemSchema)
        .min(1, { message: i18n.t('Add at least one item to pull') }),
    orgUnit: z.object({
        ids: z.array(z.string()).optional(),
        levels: z.array(z.number().int().positive()).optional(),
        groups: z.array(z.string()).optional(),
    }),
    orgUnitMatch: orgUnitMatchSchema.default('id'),
    period: pullPeriodSchema,
    chunk: z
        .object({
            periods: z.number().int().min(1).max(60).default(12),
            orgUnits: z.number().int().min(1).max(500).default(50),
        })
        .default({ periods: 12, orgUnits: 50 }),
})

export type Dhis2InstancePullConfigValue = z.infer<
    typeof dhis2InstancePullConfigSchema
>

export type CreatedAggregationType = 'SUM' | 'AVERAGE'

export function pullItemTarget(item: PullItem): string | undefined {
    return (
        item.into ?? (item.fromType === 'DATA_ELEMENT' ? item.from : undefined)
    )
}

export function defaultDhis2InstancePullConfig(): Dhis2InstancePullConfigValue {
    return {
        routeCode: '',
        items: [],
        orgUnit: { levels: [] },
        orgUnitMatch: 'id',
        period: {
            mode: 'relative',
            periodType: 'MONTHLY',
            count: 3,
            offset: 1,
        },
        chunk: { periods: 12, orgUnits: 50 },
    }
}

export function isDhis2InstancePullConfigShape(value: unknown): boolean {
    return (
        typeof value === 'object' &&
        value !== null &&
        Array.isArray((value as { items?: unknown }).items) &&
        typeof (value as { period?: unknown }).period === 'object'
    )
}
