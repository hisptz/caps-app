import i18n from '@dhis2/d2-i18n'
import { z } from 'zod'
import type { CreateMergeBody, UpdateMergeBody } from '@/capsApi/types'
import { conditionRowSchema } from '@/modules/pipeline-connectors/schemas/connectorFormSchema'
import {
    buildRule,
    parseRule,
    type RuleConditionRow,
} from '@/modules/pipeline-connectors/utils/connectorRule'
import type { PipelineMerge } from '@/shared/types/caps'

/** Matches the engine's limit (7 days). */
export const MAX_MERGE_TIMEOUT_HOURS = 7 * 24

export const mergeFormSchema = z
    .object({
        name: z
            .string()
            .trim()
            .min(1, { message: i18n.t('Name is required') }),
        description: z.string().optional(),
        sourcePipelineIds: z.array(z.string()).min(2, {
            message: i18n.t('Choose at least two pipelines to wait for'),
        }),
        targetPipelineId: z
            .string()
            .min(1, { message: i18n.t('Choose the pipeline to start') }),
        triggerRule: z.enum(['ALL_SUCCEEDED', 'ALL_DONE']),
        timeoutHours: z.string().superRefine((raw, ctx) => {
            const value = Number(raw)
            if (
                raw.trim() === '' ||
                !Number.isInteger(value) ||
                value < 1 ||
                value > MAX_MERGE_TIMEOUT_HOURS
            ) {
                ctx.addIssue({
                    code: 'custom',
                    message: i18n.t(
                        'Enter whole hours from 1 to {{max}} (7 days)',
                        { max: MAX_MERGE_TIMEOUT_HOURS }
                    ),
                })
            }
        }),
        isActive: z.boolean(),
        // Same shape as the connector form, so the condition rows can be reused
        ruleMode: z.enum(['always', 'conditions', 'json']),
        ruleMatch: z.enum(['all', 'any']),
        ruleConditions: z.array(conditionRowSchema),
        ruleJson: z.string(),
    })
    .superRefine((values, ctx) => {
        if (values.sourcePipelineIds.includes(values.targetPipelineId)) {
            ctx.addIssue({
                code: 'custom',
                path: ['targetPipelineId'],
                message: i18n.t(
                    'The pipeline to start cannot also be one it waits for'
                ),
            })
        }
        if (
            values.ruleMode === 'conditions' &&
            values.ruleConditions.length === 0
        ) {
            ctx.addIssue({
                code: 'custom',
                path: ['ruleConditions'],
                message: i18n.t('Add at least one condition'),
            })
        }
    })

export type MergeFormValues = z.infer<typeof mergeFormSchema>

export const defaultMergeFormValues: MergeFormValues = {
    name: '',
    description: '',
    sourcePipelineIds: [],
    targetPipelineId: '',
    triggerRule: 'ALL_SUCCEEDED',
    timeoutHours: '24',
    isActive: true,
    ruleMode: 'always',
    ruleMatch: 'all',
    ruleConditions: [],
    ruleJson: '',
}

/**
 * `canShow` says whether the pickers can show the parsed rows; when they cannot, the rule is
 * kept as it is ("set outside the app").
 */
export function mergeToFormValues(
    merge: PipelineMerge,
    canShow: (rows: RuleConditionRow[]) => boolean = () => true
): MergeFormValues {
    const parsed = parseRule(merge.condition)
    const hasRule = merge.condition !== null && merge.condition !== undefined
    const showable = parsed !== null && canShow(parsed.rows)
    return {
        name: merge.name,
        description: merge.description ?? '',
        sourcePipelineIds: merge.sources.map((s) => s.pipelineId),
        targetPipelineId: merge.targetPipelineId,
        triggerRule: merge.triggerRule,
        timeoutHours: String(
            Math.max(1, Math.round(merge.timeoutMinutes / 60))
        ),
        isActive: merge.isActive,
        ruleMode: !hasRule ? 'always' : showable ? 'conditions' : 'json',
        ruleMatch: parsed?.match ?? 'all',
        ruleConditions: hasRule && showable ? parsed.rows : [],
        ruleJson: hasRule ? JSON.stringify(merge.condition, null, 2) : '',
    }
}

function conditionFromValues(values: MergeFormValues): unknown {
    switch (values.ruleMode) {
        case 'always':
            return null
        case 'conditions':
            return buildRule(values.ruleMatch, values.ruleConditions)
        case 'json':
            return JSON.parse(values.ruleJson) as unknown
    }
}

export function mergeFormValuesToUpdateBody(
    values: MergeFormValues
): UpdateMergeBody {
    return {
        name: values.name.trim(),
        description: values.description?.trim() || null,
        sourcePipelineIds: values.sourcePipelineIds,
        targetPipelineId: values.targetPipelineId,
        triggerRule: values.triggerRule,
        timeoutMinutes: Number(values.timeoutHours) * 60,
        condition: conditionFromValues(values),
        isActive: values.isActive,
    }
}

export function mergeFormValuesToCreateBody(
    values: MergeFormValues,
    workflowId: string
): CreateMergeBody {
    const { description, ...rest } = mergeFormValuesToUpdateBody(values)
    return {
        ...(rest as Omit<CreateMergeBody, 'workflowId' | 'description'>),
        description: description ?? undefined,
        workflowId,
    }
}
