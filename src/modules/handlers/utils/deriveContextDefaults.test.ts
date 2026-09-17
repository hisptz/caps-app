import { z } from 'zod'
import type { HandlerDescriptor } from '@/capsApi/types'
import { deriveContextDefaults } from '@/modules/handlers/utils/deriveContextDefaults'

const contextSchema = z.object({
    orgUnit: z.object({ ids: z.array(z.string()) }),
    period: z.object({
        type: z.enum(['MONTHLY', 'WEEKLY']),
        periodOffset: z.number().int().default(0),
    }),
})

const handler: HandlerDescriptor = {
    key: 'prediction-trigger',
    displayName: 'Prediction Trigger',
    description: '',
    tags: [],
    queueName: 'step.prediction-trigger',
    schemas: {
        context: z.toJSONSchema(contextSchema, {
            target: 'draft-2020-12',
        }) as Record<string, unknown>,
    },
}

describe('deriveContextDefaults', () => {
    it('picks only keys present on context schema', () => {
        const defaults = deriveContextDefaults(
            [handler],
            'prediction-trigger',
            {
                modelId: 'm1',
                orgUnit: { ids: ['ou1'] },
                period: { type: 'MONTHLY', periodOffset: 2 },
                dataSources: [],
            }
        )
        expect(defaults).toMatchObject({
            orgUnit: { ids: ['ou1'] },
            period: { type: 'MONTHLY', periodOffset: 2 },
        })
        expect(defaults).not.toHaveProperty('modelId')
    })
})
