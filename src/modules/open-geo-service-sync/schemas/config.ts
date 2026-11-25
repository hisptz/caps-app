import { z } from 'zod'

/** Mirrors caps-engine worker `openGeoServiceSyncConfigSchema`. */
export const openGeoServiceSyncConfigSchema = z.object({
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

export type OpenGeoServiceSyncConfigValue = z.infer<
    typeof openGeoServiceSyncConfigSchema
>

/** Minimum poll interval the engine accepts for sync jobs. */
export const CLIMATE_SYNC_MIN_POLL_INTERVAL_MS = 1_000

export function defaultOpenGeoServiceSyncConfig(
    datasetIds: string[]
): OpenGeoServiceSyncConfigValue {
    return {
        datasetIds,
        onFailure: 'fail',
        polling: { pollIntervalMs: 10_000, maxAttempts: 150 },
    }
}

/** True when `value` already has the config's shape, so the form must not reset it. */
export function isOpenGeoServiceSyncConfigShape(value: unknown): boolean {
    return (
        typeof value === 'object' &&
        value !== null &&
        Array.isArray((value as { datasetIds?: unknown }).datasetIds)
    )
}
