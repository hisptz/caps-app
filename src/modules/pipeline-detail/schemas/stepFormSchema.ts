import i18n from '@dhis2/d2-i18n'
import { z } from 'zod'
import type { HandlerDescriptor } from '@/capsApi/types'
import { getHandlerConfigSchema } from '@/modules/handlers/utils/handlerConfigSchemas'
import type { PipelineStep } from '@/shared/types/caps'

/** Base fields for add/edit step modals. */
export const pipelineStepFormSchema = z.object({
    stepOrder: z.number().int().min(0),
    name: z.string().min(1, { message: i18n.t('Name is required') }),
    description: z.string().optional(),
    handlerKey: z
        .string()
        .min(1, { message: i18n.t('Handler key is required') }),
    maxRetries: z.number().int().min(0).optional(),
    retryDelayMs: z.number().int().min(0).optional(),
})

export type PipelineStepFormValues = z.infer<typeof pipelineStepFormSchema>

/**
 * Step form schema with handler config validation driven by GET /handlers catalog.
 * Pass an empty array before catalog loads; superRefine skips membership until handlers exist.
 */
export function createPipelineStepFormSchema(handlers: HandlerDescriptor[]) {
    return pipelineStepFormSchema
        .extend({
            handlerConfig: z
                .record(z.string(), z.unknown())
                .nullable()
                .optional(),
        })
        .superRefine((data, ctx) => {
            if (handlers.length === 0) {
                return
            }

            const known = handlers.some((h) => h.key === data.handlerKey)
            if (!known) {
                ctx.addIssue({
                    code: 'custom',
                    message: i18n.t('Unknown handler key'),
                    path: ['handlerKey'],
                })
                return
            }

            const configSchema = getHandlerConfigSchema(
                handlers,
                data.handlerKey
            )
            if (!configSchema) {
                return
            }

            if (
                data.handlerConfig === null ||
                data.handlerConfig === undefined
            ) {
                ctx.addIssue({
                    code: 'custom',
                    message: i18n.t('Handler configuration is required'),
                    path: ['handlerConfig'],
                })
                return
            }

            const result = configSchema.safeParse(data.handlerConfig)
            if (!result.success) {
                for (const issue of result.error.issues) {
                    ctx.addIssue({
                        ...issue,
                        path: ['handlerConfig', ...issue.path],
                    })
                }
            }
        })
}

export type PipelineStepFormWithHandlerValues = z.infer<
    ReturnType<typeof createPipelineStepFormSchema>
>

export function defaultPipelineStepFormValues(
    stepOrder: number
): PipelineStepFormWithHandlerValues {
    return {
        stepOrder,
        name: '',
        description: '',
        handlerKey: '',
        maxRetries: 3,
        retryDelayMs: 1000,
        handlerConfig: null,
    }
}

export function pipelineStepToFormValues(
    step: PipelineStep
): PipelineStepFormWithHandlerValues {
    return {
        stepOrder: step.stepOrder,
        name: step.name,
        description: step.description ?? '',
        handlerKey: step.handlerKey,
        maxRetries: step.maxRetries,
        retryDelayMs: step.retryDelayMs,
        handlerConfig: step.handlerConfig,
    }
}
