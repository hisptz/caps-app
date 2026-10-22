import i18n from '@dhis2/d2-i18n'
import { z } from 'zod'
import type { HandlerDescriptor, UpdateScheduleBody } from '@/capsApi/types'
import { DHIS2_INSTANCE_PUSH_HANDLER } from '@/modules/dhis2-instance-push/schemas/config'
import { schedulePushPeriodIssue } from '@/modules/dhis2-instance-push/utils/schedulePeriod'
import {
    buildDefaultStepContexts,
    getContextCapableSteps,
} from '@/modules/handlers/utils/contextCapableSteps'
import { getHandlerContextSchema } from '@/modules/handlers/utils/handlerContextSchemas'
import { CLIMATE_OPENEO_CREATE_HANDLER } from '@/modules/prediction-coverage/utils/predictionCoverage'
import {
    periodModeOf,
    scheduleContextPeriodIssue,
    scheduleRollingPeriod,
} from '@/shared/components/HandlerConfigForms/ClimateOpenEoCreateConfig/utils/climatePeriod'
import {
    type PullPeriodLike,
    schedulePullPeriod,
    schedulePullPeriodIssue,
} from '@/shared/components/HandlerConfigForms/Dhis2InstancePullConfig/schedulePeriod'
import { DEFAULT_PERIODS_TO_GENERATE } from '@/shared/components/HandlerConfigForms/PredictionTriggerConfig/periodIds'
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
            const periodIssue =
                step.handlerKey === CLIMATE_OPENEO_CREATE_HANDLER
                    ? scheduleContextPeriodIssue(slice)
                    : step.handlerKey === 'dhis2-instance-pull'
                      ? schedulePullPeriodIssue(slice)
                      : step.handlerKey === DHIS2_INSTANCE_PUSH_HANDLER
                        ? schedulePushPeriodIssue(slice)
                        : null
            if (periodIssue) {
                ctx.addIssue({
                    code: 'custom',
                    message: periodIssue.message,
                    path: ['stepContexts', step.id, ...periodIssue.path],
                })
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

function withRollingPredictionPeriods(
    steps: PipelineStep[],
    stepContexts: Record<string, Record<string, unknown>>
): Record<string, Record<string, unknown>> {
    const result = { ...stepContexts }
    for (const step of steps) {
        const context = result[step.id]
        if (step.handlerKey !== 'prediction-trigger' || !context) {
            continue
        }
        const period = (context.period ?? {}) as Record<string, unknown>
        result[step.id] = {
            ...context,
            period: {
                periodOffset: 1,
                numberOfPeriodsToGenerate:
                    period.numberOfPeriodsToGenerate ??
                    DEFAULT_PERIODS_TO_GENERATE,
            },
        }
    }
    return result
}

/** Keeps a schedule's rolling climate period, replacing a missing or fixed one. */
/**
 * A new schedule follows the step's period when the step uses latest periods; a fixed step
 * would repeat the same dates on every scheduled run, so the schedule starts with latest
 * periods of its own instead.
 */
function withScheduleClimatePeriods(
    steps: PipelineStep[],
    stepContexts: Record<string, Record<string, unknown>>
): Record<string, Record<string, unknown>> {
    const result = { ...stepContexts }
    for (const step of steps) {
        if (step.handlerKey !== 'climate-openeo-create') {
            continue
        }
        const stepPeriod = step.handlerConfig?.period as
            | Record<string, unknown>
            | undefined
        const context = result[step.id] ?? {}
        if (
            context.period !== undefined ||
            periodModeOf(stepPeriod) === 'rolling'
        ) {
            continue
        }
        result[step.id] = {
            ...context,
            period: scheduleRollingPeriod(stepPeriod),
        }
    }
    return result
}

/** The same for a pull: latest periods of its own when the step pulls a fixed range. */
function withSchedulePullPeriods(
    steps: PipelineStep[],
    stepContexts: Record<string, Record<string, unknown>>
): Record<string, Record<string, unknown>> {
    const result = { ...stepContexts }
    for (const step of steps) {
        if (step.handlerKey !== 'dhis2-instance-pull') {
            continue
        }
        const stepPeriod = step.handlerConfig?.period as
            | PullPeriodLike
            | undefined
        const context = result[step.id] ?? {}
        if (context.period !== undefined || stepPeriod?.mode !== 'fixed') {
            continue
        }
        result[step.id] = {
            ...context,
            period: schedulePullPeriod(stepPeriod),
        }
    }
    return result
}

export function buildScheduleFormDefaults(
    steps: PipelineStep[],
    handlers: HandlerDescriptor[]
): ScheduleFormValues {
    return {
        ...defaultScheduleFormValues,
        stepContexts: withSchedulePullPeriods(
            steps,
            withScheduleClimatePeriods(
                steps,
                withRollingPredictionPeriods(
                    steps,
                    buildDefaultStepContexts(steps, handlers)
                )
            )
        ),
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

function withoutCopiedPullPeriods(
    steps: PipelineStep[],
    stepContexts: Record<string, Record<string, unknown>>
): Record<string, Record<string, unknown>> {
    const result = { ...stepContexts }
    for (const step of steps) {
        const period = result[step.id]?.period as PullPeriodLike | undefined
        if (step.handlerKey !== 'dhis2-instance-pull' || !period) {
            continue
        }
        const rest = { ...result[step.id] }
        const stepPeriod = step.handlerConfig?.period as
            | PullPeriodLike
            | undefined
        if (JSON.stringify(period) === JSON.stringify(stepPeriod)) {
            delete rest.period
        } else if (period.mode === 'fixed') {
            // Schedules no longer take a fixed range, which pulled the same periods every run.
            rest.period = schedulePullPeriod(stepPeriod)
        }
        result[step.id] = rest
    }
    return result
}

/**
 * Schedules saved before climate steps defaulted to no override carry a copy of the step's
 * period and org units, which freezes them to the step as it was. A copy equal to the step's
 * is dropped, so the schedule follows the step again once saved; an old fixed range becomes
 * latest periods, since schedules no longer take one.
 */
function withoutCopiedClimateOverrides(
    steps: PipelineStep[],
    stepContexts: Record<string, Record<string, unknown>>
): Record<string, Record<string, unknown>> {
    const result = { ...stepContexts }
    for (const step of steps) {
        const context = result[step.id]
        if (step.handlerKey !== 'climate-openeo-create' || !context) {
            continue
        }
        const rest = { ...context }
        for (const key of ['period', 'orgUnit']) {
            if (
                rest[key] !== undefined &&
                JSON.stringify(rest[key]) ===
                    JSON.stringify(step.handlerConfig?.[key])
            ) {
                delete rest[key]
            }
        }
        if (
            rest.period !== undefined &&
            periodModeOf(rest.period as Record<string, unknown>) !== 'rolling'
        ) {
            rest.period = scheduleRollingPeriod(
                step.handlerConfig?.period as
                    | Record<string, unknown>
                    | undefined
            )
        }
        result[step.id] = rest
    }
    return result
}

export function scheduleToFormValues(
    schedule: PipelineSchedule,
    steps: PipelineStep[] = []
): ScheduleFormValues {
    return {
        name: schedule.name,
        description: schedule.description ?? '',
        cronExpression: schedule.cronExpr,
        stepContexts: withoutCopiedClimateOverrides(
            steps,
            withoutCopiedPullPeriods(
                steps,
                inputContextSteps(schedule.inputContext)
            )
        ),
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
