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
        // Left empty, a run uses the step's own config, including later edits: a copy made
        // here would freeze a schedule to the step as it was when the schedule was saved.
        if (
            step.handlerKey === 'dhis2-instance-pull' ||
            step.handlerKey === 'dhis2-instance-push' ||
            step.handlerKey === 'climate-openeo-create'
        ) {
            result[step.id] = {}
            continue
        }
        result[step.id] = deriveContextDefaults(
            handlers,
            step.handlerKey,
            step.handlerConfig
        )
    }
    return result
}
