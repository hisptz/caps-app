import { z } from 'zod'

/** Mirrors caps-engine worker `openClimateServiceSyncConfigSchema`. */
export const openClimateServiceSyncConfigSchema = z.object({
    datasetIds: z.array(z.string().min(1)).min(1),
    end: z.iso.date({ message: 'Use a date in YYYY-MM-DD format' }).optional(),
    onFailure: z.enum(['fail', 'continue']).default('fail'),
    polling: z
        .object({
            pollIntervalMs: z.number().int().min(1_000).default(10_000),
            maxAttempts: z.number().int().min(1).default(150),
        })
        .default({ pollIntervalMs: 10_000, maxAttempts: 150 }),
})

export type OpenClimateServiceSyncConfigValue = z.infer<
    typeof openClimateServiceSyncConfigSchema
>

/** Minimum poll interval the engine accepts for sync jobs. */
export const CLIMATE_SYNC_MIN_POLL_INTERVAL_MS = 1_000

export function defaultOpenClimateServiceSyncConfig(
    datasetIds: string[]
): OpenClimateServiceSyncConfigValue {
    return {
        datasetIds,
        onFailure: 'fail',
        polling: { pollIntervalMs: 10_000, maxAttempts: 150 },
    }
}

/** True when `value` already has the config's shape, so the form must not reset it. */
export function isOpenClimateServiceSyncConfigShape(value: unknown): boolean {
    return (
        typeof value === 'object' &&
        value !== null &&
        Array.isArray((value as { datasetIds?: unknown }).datasetIds)
    )
}
