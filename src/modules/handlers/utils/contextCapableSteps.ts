import type { HandlerDescriptor } from '@/capsApi/types'
import { deriveContextDefaults } from '@/modules/handlers/utils/deriveContextDefaults'
import { getHandlerByKey } from '@/modules/handlers/utils/handlerLookup'
import type { PipelineStep } from '@/shared/types/caps'

export function stepHasContextSchema(
    handlers: HandlerDescriptor[],
    handlerKey: string
): boolean {
    return Boolean(getHandlerByKey(handlers, handlerKey)?.schemas?.context)
}

export function getContextCapableSteps(
    steps: PipelineStep[],
    handlers: HandlerDescriptor[]
): PipelineStep[] {
    return steps.filter((step) =>
        stepHasContextSchema(handlers, step.handlerKey)
    )
}

export function buildDefaultStepContexts(
    steps: PipelineStep[],
    handlers: HandlerDescriptor[]
): Record<string, Record<string, unknown>> {
    const result: Record<string, Record<string, unknown>> = {}
    for (const step of getContextCapableSteps(steps, handlers)) {
        result[step.id] = deriveContextDefaults(
            handlers,
            step.handlerKey,
            step.handlerConfig
        )
    }
    return result
}
