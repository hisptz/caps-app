import { z } from 'zod'
import type { HandlerDescriptor } from '@/capsApi/types'
import {
    buildHandlerConfigSchema,
    clearHandlerConfigSchemaMemo,
    getHandlerConfigSchema,
} from '@/modules/handlers/utils/handlerConfigSchemas'
import { createPipelineStepFormSchema } from '@/modules/pipeline-detail/schemas/stepFormSchema'

const predictionTriggerValid = {
    modelId: 'model-1',
    name: 'run-1',
    orgUnit: { ids: ['ou1'] },
    period: {
        type: 'MONTHLY' as const,
        periodOffset: 0,
        numberPreviousYearsToInclude: 2,
        numberOfPeriodsToGenerate: 3,
    },
    dataSources: [{ covariate: 'rain', dataElementId: 'abcdefghijk' }],
}

const predictionTriggerSchema = z.object({
    modelId: z.string().min(1),
    name: z.string().min(1),
    orgUnit: z.object({ ids: z.array(z.string()).min(1) }),
    period: z.object({
        type: z.enum(['MONTHLY', 'WEEKLY']),
        periodOffset: z.number().int(),
        numberPreviousYearsToInclude: z.number().int().min(0),
        numberOfPeriodsToGenerate: z.number().int().min(1),
    }),
    dataSources: z
        .array(
            z.object({
                covariate: z.string(),
                dataElementId: z.string().length(11),
            })
        )
        .min(1),
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
            config: z.toJSONSchema(schema, {
                target: 'draft-2020-12',
            }) as Record<string, unknown>,
        },
    }
}

describe('handlerConfigSchemas', () => {
    beforeEach(() => {
        clearHandlerConfigSchemaMemo()
    })

    it('buildHandlerConfigSchema returns undefined when no config schema', () => {
        const d: HandlerDescriptor = {
            key: 'prediction-poll',
            displayName: 'Poll',
            description: '',
            tags: [],
            queueName: 'step.prediction-poll',
        }
        expect(buildHandlerConfigSchema(d)).toBeUndefined()
    })

    it('accepts valid prediction-trigger config via fromJSONSchema', () => {
        const descriptor = descriptorFromZod(
            'prediction-trigger',
            predictionTriggerSchema
        )
        const schema = buildHandlerConfigSchema(descriptor)
        expect(schema?.safeParse(predictionTriggerValid).success).toBe(true)
        expect(schema?.safeParse({}).success).toBe(false)
    })

    it('getHandlerConfigSchema memoizes per handler key', () => {
        const handlers = [
            descriptorFromZod('prediction-trigger', predictionTriggerSchema),
        ]
        const a = getHandlerConfigSchema(handlers, 'prediction-trigger')
        const b = getHandlerConfigSchema(handlers, 'prediction-trigger')
        expect(a).toBe(b)
    })
})

describe('createPipelineStepFormSchema', () => {
    beforeEach(() => {
        clearHandlerConfigSchemaMemo()
    })

    it('rejects unknown handler key when catalog is non-empty', () => {
        const schema = createPipelineStepFormSchema([
            {
                key: 'climate-openeo-create',
                displayName: 'Open Climate Service Create',
                description: '',
                tags: ['climate', 'openeo'],
                queueName: 'step.climate-openeo-create',
            },
        ])
        const result = schema.safeParse({
            stepOrder: 0,
            name: 'Step',
            handlerKey: 'unknown-handler',
            handlerConfig: null,
        })
        expect(result.success).toBe(false)
    })

    it('requires handlerConfig when handler has config schema', () => {
        const schema = createPipelineStepFormSchema([
            descriptorFromZod('prediction-trigger', predictionTriggerSchema),
        ])
        const missing = schema.safeParse({
            stepOrder: 0,
            name: 'Step',
            handlerKey: 'prediction-trigger',
            handlerConfig: null,
        })
        expect(missing.success).toBe(false)

        const valid = schema.safeParse({
            stepOrder: 0,
            name: 'Step',
            handlerKey: 'prediction-trigger',
            handlerConfig: predictionTriggerValid,
        })
        expect(valid.success).toBe(true)
    })
})
