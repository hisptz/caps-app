import { z } from 'zod'
import type { HandlerDescriptor } from '@/capsApi/types'
import {
    buildDefaultStepContexts,
    getContextCapableSteps,
} from '@/modules/handlers/utils/contextCapableSteps'
import { getHandlerContextSchema } from '@/modules/handlers/utils/handlerContextSchemas'
import type { PipelineStep } from '@/shared/types/caps'

export const pipelineContextFormSchema = z.object({
    stepContexts: z
        .record(z.string(), z.record(z.string(), z.unknown()))
        .optional(),
})

export type PipelineContextFormValues = z.infer<
    typeof pipelineContextFormSchema
>

export function createPipelineContextFormSchema(
    steps: PipelineStep[],
    handlers: HandlerDescriptor[]
) {
    return pipelineContextFormSchema.superRefine((data, ctx) => {
        if (handlers.length === 0) {
            return
        }
        for (const step of getContextCapableSteps(steps, handlers)) {
            const slice = data.stepContexts?.[step.id]
            if (slice === undefined || slice === null) {
                continue
            }
            const schema = getHandlerContextSchema(handlers, step.handlerKey)
            if (!schema) {
                continue
            }
            const result = schema.safeParse(slice)
            if (!result.success) {
                for (const issue of result.error.issues) {
                    ctx.addIssue({
                        ...issue,
                        path: ['stepContexts', step.id, ...issue.path],
                    })
                }
            }
        }
    })
}

export function toPipelineInputContext(values: PipelineContextFormValues): {
    steps: Record<string, Record<string, unknown>>
} {
    return { steps: values.stepContexts ?? {} }
}

export const defaultPipelineContextFormValues: PipelineContextFormValues = {
    stepContexts: {},
}

export function buildPipelineContextFormDefaults(
    steps: PipelineStep[],
    handlers: HandlerDescriptor[]
): PipelineContextFormValues {
    return {
        stepContexts: buildDefaultStepContexts(steps, handlers),
    }
}
