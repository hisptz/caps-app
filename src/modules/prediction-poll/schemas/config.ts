import { z } from 'zod'

export const predictionPollConfigSchema = z.object({
    polling: z
        .object({
            intervalSeconds: z.number().int().min(5).max(3600).default(30),
            timeoutHours: z.number().min(0.25).max(72).default(6),
        })
        .default({ intervalSeconds: 30, timeoutHours: 6 }),
})

export type PredictionPollConfigValue = z.infer<
    typeof predictionPollConfigSchema
>

export function defaultPredictionPollConfig(): PredictionPollConfigValue {
    return predictionPollConfigSchema.parse({})
}

export function isPredictionPollConfig(
    value: unknown
): value is PredictionPollConfigValue {
    return predictionPollConfigSchema.safeParse(value).success
}
