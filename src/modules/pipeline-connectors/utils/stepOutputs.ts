import i18n from '@dhis2/d2-i18n'
import type {
    HandlerDescriptor,
    HandlerOutputField,
    HandlerOutputType,
} from '@/capsApi/types'
import type { RuleConditionRow } from '@/modules/pipeline-connectors/utils/connectorRule'
import type { PipelineStep } from '@/shared/types/caps'

/**
 * The engine stores each finished step's result twice in the run's context:
 * `stepOutputs.<stepId>` (by step id) and `step_<n>_output` (by position). Connector conditions
 * use the step-id form so they keep pointing at the same step when steps are reordered;
 * the position form is still read so older rules open. These helpers let the connector form
 * offer a step and one of its result fields instead of asking people to type the path.
 */

const BY_ID_PATH = /^stepOutputs\.([^.]+)(?:\.(.*))?$/
const BY_POSITION_PATH = /^step_(\d+)_output(?:\.(.*))?$/

/** `stepOutputs.<stepId>.<field>`; field may be empty while the user is still choosing. */
export function stepOutputPath(stepId: string, field: string): string {
    return `stepOutputs.${stepId}.${field}`
}

export type ParsedStepPath = {
    /** Position in `steps`, or -1 when the step id is not one of them */
    stepIndex: number
    field: string
    /** Written as `step_<n>_output`; saved again in the step-id form once edited */
    byPosition: boolean
}

export function parseStepOutputPath(
    path: string,
    steps: PipelineStep[]
): ParsedStepPath | null {
    const text = path.trim()
    const byId = BY_ID_PATH.exec(text)
    if (byId) {
        return {
            stepIndex: steps.findIndex((step) => step.id === byId[1]),
            field: byId[2] ?? '',
            byPosition: false,
        }
    }
    const byPosition = BY_POSITION_PATH.exec(text)
    if (byPosition) {
        const stepIndex = Number(byPosition[1])
        return {
            stepIndex: stepIndex < steps.length ? stepIndex : -1,
            field: byPosition[2] ?? '',
            byPosition: true,
        }
    }
    return null
}

/**
 * The fields a step's result has, following pass-through steps (like notifications) back
 * to the step whose result they forward. Null when the engine does not say.
 */
export function stepOutputFields(
    steps: PipelineStep[],
    stepIndex: number,
    handlers: HandlerDescriptor[]
): HandlerOutputField[] | null {
    for (let index = stepIndex; index >= 0; index--) {
        const step = steps[index]
        const outputs = handlers.find(
            (h) => h.key === step?.handlerKey
        )?.outputs
        if (!outputs) {
            return null
        }
        if ('fields' in outputs) {
            return outputs.fields
        }
    }
    return []
}

export function stepLabel(step: PipelineStep, stepIndex: number): string {
    return i18n.t('Step {{number}}: {{name}}', {
        number: stepIndex + 1,
        name: step.name,
        interpolation: { escapeValue: false },
    })
}

export type PathInfo = {
    label: string
    type: HandlerOutputType | undefined
}

/** "Pull data → Values pulled" for a known step field; the raw path otherwise. */
export function describeOutputPath(
    path: string,
    steps: PipelineStep[],
    handlers: HandlerDescriptor[]
): PathInfo {
    const parsed = parseStepOutputPath(path, steps)
    const step = parsed ? steps[parsed.stepIndex] : undefined
    if (!parsed || !step) {
        return { label: path, type: undefined }
    }
    const field = stepOutputFields(steps, parsed.stepIndex, handlers)?.find(
        (f) => f.key === parsed.field
    )
    return {
        label: `${step.name} → ${field?.label ?? parsed.field}`,
        type: field?.type,
    }
}

/** The listed result a path points at, or undefined when the pickers cannot show it. */
export function pickableField(
    path: string,
    steps: PipelineStep[],
    handlers: HandlerDescriptor[]
): HandlerOutputField | undefined {
    const parsed = parseStepOutputPath(path, steps)
    if (!parsed || parsed.stepIndex < 0) {
        return undefined
    }
    return stepOutputFields(steps, parsed.stepIndex, handlers)?.find(
        (f) => f.key === parsed.field
    )
}

/** True when every row points at a listed result, so the pickers can show it. */
export function rowsArePickable(
    rows: RuleConditionRow[],
    steps: PipelineStep[],
    handlers: HandlerDescriptor[]
): boolean {
    return rows.every(
        (row) => pickableField(row.path, steps, handlers) !== undefined
    )
}
