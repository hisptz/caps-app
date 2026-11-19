import i18n from '@dhis2/d2-i18n'
import { z } from 'zod'
import type {
    OcsPipeline,
    OcsPipelineCreateBody,
    OcsWorkflowParameterOption,
} from '@/capsApi/types'

/** The destination plugin CAPS sets up; OCS may offer others, CAPS only delivers to DHIS2. */
export const OCS_DHIS2_DESTINATION = 'dhis2'

const UID = /^[A-Za-z][A-Za-z0-9]{10}$/
const OCS_ID = /^[A-Za-z0-9][A-Za-z0-9_-]*$/
const FROM_FEATURES = 'from_features'

export const ocsPipelineFormSchema = z.object({
    id: z
        .string()
        .trim()
        .min(1, i18n.t('Give the pipeline an id'))
        .regex(
            OCS_ID,
            i18n.t(
                "Start with a letter or digit; use only letters, digits, '_' or '-'"
            )
        ),
    name: z.string().trim().optional(),
    workflowId: z.string().min(1, i18n.t('Choose a workflow')),
    /** Each argument as typed; turned into the parameter's type on save. */
    arguments: z.record(z.string(), z.string()),
    connection: z.string().trim().min(1, i18n.t('Choose a DHIS2 connection')),
    dataSet: z
        .string()
        .trim()
        .regex(
            UID,
            i18n.t('Enter a DHIS2 UID (11 characters, starting with a letter)')
        )
        .or(z.literal(''))
        .optional(),
    series: z
        .array(
            z.object({
                dataElement: z
                    .string()
                    .regex(UID, i18n.t('Choose a data element')),
                categoryOptionCombo: z
                    .string()
                    .trim()
                    .regex(
                        UID,
                        i18n.t(
                            'Enter a DHIS2 UID (11 characters, starting with a letter)'
                        )
                    )
                    .or(z.literal(''))
                    .optional(),
            })
        )
        .min(1, i18n.t('Map at least one result series to a data element')),
})

export type OcsPipelineFormValues = z.infer<typeof ocsPipelineFormSchema>

export const emptyOcsPipelineForm: OcsPipelineFormValues = {
    id: '',
    name: '',
    workflowId: '',
    arguments: {},
    connection: '',
    dataSet: '',
    series: [{ dataElement: '', categoryOptionCombo: '' }],
}

export type ParameterKind =
    | 'features'
    | 'dataset'
    | 'enum'
    | 'number'
    | 'boolean'
    | 'text'
    | 'json'

/** How a workflow parameter is filled in, from its declared schema (as OCS reads it). */
export function parameterKind(
    parameter: OcsWorkflowParameterOption
): ParameterKind {
    const schema = parameter.schema ?? {}
    if (schema.subtype === 'geojson') {
        return 'features'
    }
    if (schema.subtype === 'collection-id') {
        return 'dataset'
    }
    if (Array.isArray(schema.enum)) {
        return 'enum'
    }
    switch (schema.type) {
        case 'integer':
        case 'number':
            return 'number'
        case 'boolean':
            return 'boolean'
        case 'object':
        case 'array':
            return 'json'
        default:
            return 'text'
    }
}

/** An argument as the form holds it: a feature collection by its id, anything else as text. */
function argumentToText(value: unknown): string {
    if (value === undefined || value === null) {
        return ''
    }
    if (
        typeof value === 'object' &&
        !Array.isArray(value) &&
        typeof (value as Record<string, unknown>)[FROM_FEATURES] === 'string'
    ) {
        return (value as Record<string, string>)[FROM_FEATURES]
    }
    return typeof value === 'string' ? value : JSON.stringify(value)
}

/** The typed value OCS takes for a parameter, or undefined to leave it out. Throws on bad JSON. */
export function argumentFromText(
    parameter: OcsWorkflowParameterOption,
    text: string | undefined
): unknown {
    const value = (text ?? '').trim()
    if (value === '') {
        return undefined
    }
    switch (parameterKind(parameter)) {
        case 'features':
            return { [FROM_FEATURES]: value }
        case 'number':
            return Number(value)
        case 'boolean':
            return value === 'true'
        case 'json':
            return JSON.parse(value) as unknown
        default:
            return value
    }
}

/** Checks the arguments against the workflow's parameters; problems by parameter name. */
export function argumentProblems(
    parameters: OcsWorkflowParameterOption[],
    values: Record<string, string>
): Record<string, string> {
    const problems: Record<string, string> = {}
    for (const parameter of parameters) {
        const text = (values[parameter.name] ?? '').trim()
        if (text === '') {
            if (parameter.required) {
                problems[parameter.name] = i18n.t('Required')
            }
            continue
        }
        const kind = parameterKind(parameter)
        if (kind === 'number' && Number.isNaN(Number(text))) {
            problems[parameter.name] = i18n.t('Enter a number')
        }
        if (kind === 'json') {
            try {
                JSON.parse(text)
            } catch {
                problems[parameter.name] = i18n.t('Enter valid JSON')
            }
        }
    }
    return problems
}

export function toOcsPipelineBody(
    values: OcsPipelineFormValues,
    parameters: OcsWorkflowParameterOption[]
): OcsPipelineCreateBody {
    const args: Record<string, unknown> = {}
    for (const parameter of parameters) {
        const value = argumentFromText(
            parameter,
            values.arguments[parameter.name]
        )
        if (value !== undefined) {
            args[parameter.name] = value
        }
    }
    const settings: Record<string, unknown> = {
        connection: values.connection.trim(),
        series: values.series.map((row) => ({
            data_element: row.dataElement,
            ...(row.categoryOptionCombo
                ? { category_option_combo: row.categoryOptionCombo }
                : {}),
        })),
    }
    if (values.dataSet) {
        settings.data_set = values.dataSet
    }
    return {
        id: values.id.trim(),
        name: values.name?.trim() || null,
        workflow: { id: values.workflowId, arguments: args },
        destination: { plugin: OCS_DHIS2_DESTINATION, settings },
    }
}

export function fromOcsPipeline(pipeline: OcsPipeline): OcsPipelineFormValues {
    const settings = pipeline.spec.destination.settings
    const series = Array.isArray(settings.series)
        ? (settings.series as Array<Record<string, unknown>>)
        : []
    return {
        id: pipeline.spec.id,
        name: pipeline.spec.name ?? '',
        workflowId: pipeline.spec.workflow.id,
        arguments: Object.fromEntries(
            Object.entries(pipeline.spec.workflow.arguments).map(
                ([key, value]) => [key, argumentToText(value)]
            )
        ),
        connection:
            typeof settings.connection === 'string' ? settings.connection : '',
        dataSet: typeof settings.data_set === 'string' ? settings.data_set : '',
        series:
            series.length > 0
                ? series.map((row) => ({
                      dataElement: String(row.data_element ?? ''),
                      categoryOptionCombo:
                          typeof row.category_option_combo === 'string'
                              ? row.category_option_combo
                              : '',
                  }))
                : emptyOcsPipelineForm.series,
    }
}
