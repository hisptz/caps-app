import i18n from '@dhis2/d2-i18n'
import { z } from 'zod'
import type { CreateWorkflowBody, UpdateWorkflowBody } from '@/capsApi/types'
import { splitCronExpression } from '@/modules/pipeline-detail/utils/cronHelpers'
import type { Workflow } from '@/shared/types/caps'

export const workflowFormSchema = z
    .object({
        name: z
            .string()
            .trim()
            .min(1, { message: i18n.t('Name is required') }),
        description: z.string().optional(),
        isActive: z.boolean(),
        /** Off = started with the Run button only */
        scheduled: z.boolean(),
        // Named like the pipeline schedule form so CronPanel can be reused
        cronExpression: z.string(),
    })
    .superRefine((values, ctx) => {
        if (
            values.scheduled &&
            !splitCronExpression(values.cronExpression).valid
        ) {
            ctx.addIssue({
                code: 'custom',
                path: ['cronExpression'],
                message: i18n.t(
                    'Enter a 5-part cron expression, e.g. 0 6 1 * *'
                ),
            })
        }
    })

export type WorkflowFormValues = z.infer<typeof workflowFormSchema>

export const defaultWorkflowFormValues: WorkflowFormValues = {
    name: '',
    description: '',
    isActive: true,
    scheduled: false,
    cronExpression: '0 6 1 * *',
}

export function workflowToFormValues(workflow: Workflow): WorkflowFormValues {
    return {
        name: workflow.name,
        description: workflow.description ?? '',
        isActive: workflow.isActive,
        scheduled: Boolean(workflow.cronExpr),
        cronExpression:
            workflow.cronExpr ?? defaultWorkflowFormValues.cronExpression,
    }
}

function cronFromValues(values: WorkflowFormValues): string | null {
    return values.scheduled ? values.cronExpression.trim() : null
}

export function workflowFormValuesToCreateBody(
    values: WorkflowFormValues
): CreateWorkflowBody {
    return {
        name: values.name.trim(),
        description: values.description?.trim() || undefined,
        isActive: values.isActive,
        cronExpr: cronFromValues(values),
    }
}

export function workflowFormValuesToUpdateBody(
    values: WorkflowFormValues
): UpdateWorkflowBody {
    return {
        name: values.name.trim(),
        description: values.description?.trim() || null,
        isActive: values.isActive,
        cronExpr: cronFromValues(values),
    }
}
