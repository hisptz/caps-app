import i18n from '@dhis2/d2-i18n'
import { z } from 'zod'
import type { HandlerDescriptor, UpdateScheduleBody } from '@/capsApi/types'
import {
    buildDefaultStepContexts,
    getContextCapableSteps,
} from '@/modules/handlers/utils/contextCapableSteps'
import { getHandlerContextSchema } from '@/modules/handlers/utils/handlerContextSchemas'
import type { PipelineSchedule, PipelineStep } from '@/shared/types/caps'

const scheduleFieldsSchema = z.object({
    name: z.string().min(1, { message: i18n.t('Name is required') }),
    description: z.string().optional(),
    cronExpression: z.string().min(1, {
        message: i18n.t('Cron expression is required'),
    }),
    stepContexts: z
        .record(z.string(), z.record(z.string(), z.unknown()))
        .optional(),
})

export function createScheduleFormSchema(
    steps: PipelineStep[],
    handlers: HandlerDescriptor[]
) {
    return scheduleFieldsSchema.superRefine((data, ctx) => {
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

/** Default schema before steps/handlers are available. */
export const scheduleFormSchema = createScheduleFormSchema([], [])

export type ScheduleFormValues = z.infer<typeof scheduleFieldsSchema>

export const defaultScheduleFormValues: ScheduleFormValues = {
    name: '',
    description: '',
    cronExpression: '',
    stepContexts: {},
}

export function buildScheduleFormDefaults(
    steps: PipelineStep[],
    handlers: HandlerDescriptor[]
): ScheduleFormValues {
    return {
        ...defaultScheduleFormValues,
        stepContexts: buildDefaultStepContexts(steps, handlers),
    }
}

export function toScheduleInputContext(values: ScheduleFormValues): {
    steps: Record<string, Record<string, unknown>>
} {
    return { steps: values.stepContexts ?? {} }
}

export type CreateSchedulePayload = {
    name: string
    description?: string
    cronExpr: string
    inputContext?: { steps: Record<string, Record<string, unknown>> }
}

function inputContextSteps(
    inputContext: Record<string, unknown> | null
): Record<string, Record<string, unknown>> {
    const steps = inputContext?.steps
    if (steps && typeof steps === 'object' && !Array.isArray(steps)) {
        return steps as Record<string, Record<string, unknown>>
    }
    return {}
}

export function scheduleToFormValues(
    schedule: PipelineSchedule
): ScheduleFormValues {
    return {
        name: schedule.name,
        description: schedule.description ?? '',
        cronExpression: schedule.cronExpr,
        stepContexts: inputContextSteps(schedule.inputContext),
    }
}

export function scheduleFormValuesToUpdateBody(
    values: ScheduleFormValues
): UpdateScheduleBody {
    return {
        name: values.name,
        description: values.description || null,
        cronExpr: values.cronExpression.trim(),
        inputContext: toScheduleInputContext(values),
    }
}

export function scheduleFormValuesToCreateBody(
    values: ScheduleFormValues
): CreateSchedulePayload {
    return {
        name: values.name,
        description: values.description || undefined,
        cronExpr: values.cronExpression.trim(),
        inputContext: toScheduleInputContext(values),
    }
}
