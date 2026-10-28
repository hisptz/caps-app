import {
    defaultPredictionPollConfig,
    predictionPollConfigSchema,
} from './config'

describe('predictionPollConfigSchema', () => {
    it('provides the CAPS defaults', () => {
        expect(defaultPredictionPollConfig()).toEqual({
            polling: {
                intervalSeconds: 30,
                timeoutHours: 6,
            },
        })
    })

    it('enforces the supported polling limits', () => {
        expect(
            predictionPollConfigSchema.safeParse({
                polling: { intervalSeconds: 4, timeoutHours: 6 },
            }).success
        ).toBe(false)
        expect(
            predictionPollConfigSchema.safeParse({
                polling: { intervalSeconds: 3601, timeoutHours: 6 },
            }).success
        ).toBe(false)
        expect(
            predictionPollConfigSchema.safeParse({
                polling: { intervalSeconds: 30, timeoutHours: 72.25 },
            }).success
        ).toBe(false)
    })
})
