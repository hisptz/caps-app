import i18n from '@dhis2/d2-i18n'
import { z } from 'zod'
import type { CreateConnectorBody, UpdateConnectorBody } from '@/capsApi/types'
import {
    buildRule,
    parseRule,
    type RuleConditionRow,
} from '@/modules/pipeline-connectors/utils/connectorRule'
import type { PipelineConnector } from '@/shared/types/caps'

/** Matches the engine's limit (7 days). */
export const MAX_CONNECTOR_DELAY_MINUTES = 7 * 24 * 60

const RESERVED_PATH_SEGMENTS = new Set([
    '__proto__',
    'prototype',
    'constructor',
])

/** Same rule as the engine: no empty segments and no prototype names. */
export function targetPathIssue(path: string): string | null {
    const segments = path.split('.')
    if (segments.some((segment) => segment === '')) {
        return i18n.t('A path cannot have empty parts, e.g. "a..b"')
    }
    if (segments.some((segment) => RESERVED_PATH_SEGMENTS.has(segment))) {
        return i18n.t('This path uses a reserved name')
    }
    return null
}

const conditionRowSchema = z
    .object({
        path: z
            .string()
            .trim()
            .min(1, { message: i18n.t('Choose what to check') }),
        operator: z.enum(['gt', 'gte', 'lt', 'eq']),
        value: z.string(),
    })
    .superRefine((row, ctx) => {
        // A step picked but no result yet: "stepOutputs.<id>."
        if (row.path.trim().endsWith('.')) {
            ctx.addIssue({
                code: 'custom',
                path: ['path'],
                message: i18n.t('Choose which result to check'),
            })
        }
        if (row.value.trim() === '' || Number.isNaN(Number(row.value.trim()))) {
            ctx.addIssue({
                code: 'custom',
                path: ['value'],
                message: i18n.t('Enter a number'),
            })
        }
    })

const mappingRowSchema = z
    .object({
        target: z
            .string()
            .trim()
            .min(1, { message: i18n.t('Enter where the value goes') }),
        source: z
            .string()
            .trim()
            .min(1, { message: i18n.t('Enter where the value comes from') }),
    })
    .superRefine((row, ctx) => {
        const issue = targetPathIssue(row.target.trim())
        if (issue) {
            ctx.addIssue({ code: 'custom', path: ['target'], message: issue })
        }
    })

export const connectorFormSchema = z
    .object({
        name: z
            .string()
            .trim()
            .min(1, { message: i18n.t('Name is required') }),
        description: z.string().optional(),
        targetPipelineId: z
            .string()
            .min(1, { message: i18n.t('Choose the pipeline to run') }),
        /** '' = start nothing when the condition is not met */
        otherwisePipelineId: z.string(),
        on: z.enum(['COMPLETED', 'FAILED', 'FINISHED']),
        delayMinutes: z.string().superRefine((raw, ctx) => {
            const value = Number(raw)
            if (
                raw.trim() === '' ||
                !Number.isInteger(value) ||
                value < 0 ||
                value > MAX_CONNECTOR_DELAY_MINUTES
            ) {
                ctx.addIssue({
                    code: 'custom',
                    message: i18n.t(
                        'Enter whole minutes from 0 to {{max}} (7 days)',
                        { max: MAX_CONNECTOR_DELAY_MINUTES }
                    ),
                })
            }
        }),
        isActive: z.boolean(),
        ruleMode: z.enum(['always', 'conditions', 'json']),
        ruleMatch: z.enum(['all', 'any']),
        ruleConditions: z.array(conditionRowSchema),
        ruleJson: z.string(),
        // Not editable in the app for now; kept so a connector's existing mapping
        // (set through the API) survives saving the connector here
        inputMappings: z.array(mappingRowSchema),
    })
    .superRefine((values, ctx) => {
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
        if (
            values.ruleMode !== 'always' &&
            values.otherwisePipelineId !== '' &&
            values.otherwisePipelineId === values.targetPipelineId
        ) {
            ctx.addIssue({
                code: 'custom',
                path: ['otherwisePipelineId'],
                message: i18n.t(
                    'Choose a different pipeline from the one above'
                ),
            })
        }
        const seen = new Set<string>()
        values.inputMappings.forEach((row, index) => {
            const target = row.target.trim()
            if (seen.has(target)) {
                ctx.addIssue({
                    code: 'custom',
                    path: ['inputMappings', index, 'target'],
                    message: i18n.t('This target is already mapped'),
                })
            }
            seen.add(target)
        })
    })

export type ConnectorFormValues = z.infer<typeof connectorFormSchema>

export const defaultConnectorFormValues: ConnectorFormValues = {
    name: '',
    description: '',
    targetPipelineId: '',
    otherwisePipelineId: '',
    on: 'COMPLETED',
    delayMinutes: '0',
    isActive: true,
    ruleMode: 'always',
    ruleMatch: 'all',
    ruleConditions: [],
    ruleJson: '',
    inputMappings: [],
}

export function connectorToFormValues(
    connector: PipelineConnector,
    canShow: (rows: RuleConditionRow[]) => boolean = () => true
): ConnectorFormValues {
    const parsed = parseRule(connector.condition)
    const hasRule =
        connector.condition !== null && connector.condition !== undefined
    const showable = parsed !== null && canShow(parsed.rows)
    return {
        name: connector.name,
        description: connector.description ?? '',
        targetPipelineId: connector.targetPipelineId,
        otherwisePipelineId: connector.otherwisePipelineId ?? '',
        on: connector.on,
        delayMinutes: String(connector.delayMinutes),
        isActive: connector.isActive,
        ruleMode: !hasRule ? 'always' : showable ? 'conditions' : 'json',
        ruleMatch: parsed?.match ?? 'all',
        ruleConditions: hasRule && showable ? parsed.rows : [],
        ruleJson: hasRule ? JSON.stringify(connector.condition, null, 2) : '',
        inputMappings: Object.entries(connector.inputMapping ?? {}).map(
            ([target, source]) => ({ target, source })
        ),
    }
}

function conditionFromValues(values: ConnectorFormValues): unknown {
    switch (values.ruleMode) {
        case 'always':
            return null
        case 'conditions':
            return buildRule(values.ruleMatch, values.ruleConditions)
        case 'json':
            return JSON.parse(values.ruleJson) as unknown
    }
}

/** Only a connector with a condition can have an otherwise pipeline. */
function otherwiseFromValues(values: ConnectorFormValues): string | null {
    return values.ruleMode === 'always'
        ? null
        : values.otherwisePipelineId || null
}

function inputMappingFromValues(
    values: ConnectorFormValues
): Record<string, string> {
    return Object.fromEntries(
        values.inputMappings.map((row) => [
            row.target.trim(),
            row.source.trim(),
        ])
    )
}

export function connectorFormValuesToCreateBody(
    values: ConnectorFormValues,
    sourcePipelineId: string
): CreateConnectorBody {
    return {
        name: values.name.trim(),
        description: values.description?.trim() || undefined,
        sourcePipelineId,
        targetPipelineId: values.targetPipelineId,
        otherwisePipelineId: otherwiseFromValues(values),
        on: values.on,
        condition: conditionFromValues(values),
        inputMapping: inputMappingFromValues(values),
        delayMinutes: Number(values.delayMinutes),
        isActive: values.isActive,
    }
}

export function connectorFormValuesToUpdateBody(
    values: ConnectorFormValues
): UpdateConnectorBody {
    return {
        name: values.name.trim(),
        description: values.description?.trim() || null,
        targetPipelineId: values.targetPipelineId,
        otherwisePipelineId: otherwiseFromValues(values),
        on: values.on,
        condition: conditionFromValues(values),
        inputMapping: inputMappingFromValues(values),
        delayMinutes: Number(values.delayMinutes),
        isActive: values.isActive,
    }
}
