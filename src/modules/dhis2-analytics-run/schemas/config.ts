import { z } from 'zod'

/**
 * Mirrors caps-engine worker `dhis2AnalyticsRunConfigSchema`. Tracked entities and outliers are
 * skipped by default, as the DHIS2 Data Administration app does.
 */
export const dhis2AnalyticsRunConfigSchema = z.object({
    runOptions: z
        .object({
            lastYears: z.number().int().nonnegative().optional(),
            skipAggregate: z.boolean().default(false),
            skipEnrollment: z.boolean().default(false),
            skipEvents: z.boolean().default(false),
            skipOrgUnitOwnership: z.boolean().default(false),
            skipOutliers: z.boolean().default(true),
            skipResourceTables: z.boolean().default(false),
            skipTrackedEntities: z.boolean().default(true),
            skipValidationResult: z.boolean().default(false),
        })
        .default({
            skipAggregate: false,
            skipEnrollment: false,
            skipEvents: false,
            skipOrgUnitOwnership: false,
            skipOutliers: true,
            skipResourceTables: false,
            skipTrackedEntities: true,
            skipValidationResult: false,
        }),
    polling: z
        .object({
            pollIntervalMs: z.number().int().min(250).default(5_000),
            maxAttempts: z.number().int().min(1).default(120),
        })
        .default({
            pollIntervalMs: 5_000,
            maxAttempts: 120,
        }),
})

export type Dhis2AnalyticsRunConfigValue = z.infer<
    typeof dhis2AnalyticsRunConfigSchema
>

/** Starts on all years, like the DHIS2 Data Administration app. */
export function defaultDhis2AnalyticsRunConfig(): Dhis2AnalyticsRunConfigValue {
    return dhis2AnalyticsRunConfigSchema.parse({})
}

export function isDhis2AnalyticsRunConfig(
    value: unknown
): value is Dhis2AnalyticsRunConfigValue {
    return dhis2AnalyticsRunConfigSchema.safeParse(value).success
}
