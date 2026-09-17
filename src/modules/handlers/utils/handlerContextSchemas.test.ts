import { z } from 'zod'
import type { HandlerDescriptor } from '@/capsApi/types'
import {
    buildHandlerContextSchema,
    clearHandlerContextSchemaMemo,
    getHandlerContextSchema,
} from '@/modules/handlers/utils/handlerContextSchemas'

const predictionContextSchema = z.object({
    orgUnit: z.object({ ids: z.array(z.string()).min(1) }),
    period: z.object({
        type: z.enum(['WEEKLY', 'MONTHLY']),
        periodOffset: z.number().int(),
        numberPreviousYearsToInclude: z.number().int().min(0),
        numberOfPeriodsToGenerate: z.number().int().min(1),
    }),
})

function descriptorFromZod(
    key: string,
    schema: z.ZodObject
): HandlerDescriptor {
    return {
        key,
        displayName: key,
        description: '',
        tags: [],
        queueName: `step.${key}`,
        schemas: {
            context: z.toJSONSchema(schema, {
                target: 'draft-2020-12',
            }) as Record<string, unknown>,
        },
    }
}

describe('handlerContextSchemas', () => {
    beforeEach(() => {
        clearHandlerContextSchemaMemo()
    })

    it('buildHandlerContextSchema returns undefined when no context schema', () => {
        const d: HandlerDescriptor = {
            key: 'prediction-poll',
            displayName: 'Poll',
            description: '',
            tags: [],
            queueName: 'step.prediction-poll',
        }
        expect(buildHandlerContextSchema(d)).toBeUndefined()
    })

    it('getHandlerContextSchema memoizes per handler key', () => {
        const handlers = [
            descriptorFromZod('prediction-trigger', predictionContextSchema),
        ]
        const a = getHandlerContextSchema(handlers, 'prediction-trigger')
        const b = getHandlerContextSchema(handlers, 'prediction-trigger')
        expect(a).toBe(b)
    })
})
