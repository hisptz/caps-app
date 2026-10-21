import i18n from '@dhis2/d2-i18n'
import type { PipelineStep } from '@/shared/types/caps'

export type NotifyTemplate = { subject: string; message: string }

/**
 * Translates `text` and puts engine placeholders (e.g. `{{pipelineName}}`) where its variables are.
 * The placeholders can't be passed as i18n values directly: d2-i18n's i18next re-interpolates
 * `{{…}}` inside values and blanks them, so a marker goes in first and is swapped afterwards.
 */
function withPlaceholders(
    text: string,
    placeholders: Record<string, string>
): string {
    const markers = Object.fromEntries(
        Object.keys(placeholders).map((key) => [key, `@@${key}@@`])
    )
    let out = i18n.t(text, {
        ...markers,
        interpolation: { escapeValue: false },
    })
    for (const [key, placeholder] of Object.entries(placeholders)) {
        out = out.split(markers[key]).join(placeholder)
    }
    return out
}

const PIPELINE = { pipeline: '{{pipelineName}}' }

function body(intro: string, details: string[] = []): string {
    return [
        intro,
        ...(details.length > 0 ? ['', ...details] : []),
        '',
        i18n.t('View this run in CAPS:'),
        '{{runUrl}}',
        '',
        withPlaceholders('Sent automatically by CAPS on {{date}}.', {
            date: '{{date}}',
        }),
    ].join('\n')
}

/**
 * Suggested subject and message for a DHIS2 Notify step, based on the step it follows.
 * `{{input.<field>}}` placeholders match that handler's output in caps-engine.
 */
export function suggestedNotifyTemplate(args: {
    previousHandlerKey?: string
}): NotifyTemplate {
    const subject = (what: string) => `{{pipelineName}}: ${what}`

    switch (args.previousHandlerKey) {
        case 'prediction-poll':
            return {
                subject: subject(i18n.t('new prediction ready')),
                message: body(
                    withPlaceholders(
                        'A new prediction from the pipeline "{{pipeline}}" has finished in CHAP and is ready to review.',
                        PIPELINE
                    )
                ),
            }
        case 'prediction-data-download':
            return {
                subject: subject(i18n.t('prediction results downloaded')),
                message: body(
                    withPlaceholders(
                        'The pipeline "{{pipeline}}" downloaded {{count}} predicted values from CHAP.',
                        { ...PIPELINE, count: '{{input.count}}' }
                    )
                ),
            }
        case 'dhis2-data-upload':
            return {
                subject: subject(i18n.t('new data in DHIS2')),
                message: body(
                    withPlaceholders(
                        'The pipeline "{{pipeline}}" has imported new values into DHIS2.',
                        PIPELINE
                    ),
                    [
                        `${i18n.t('Imported')}: {{input.imported}}`,
                        `${i18n.t('Updated')}: {{input.updated}}`,
                        `${i18n.t('Ignored')}: {{input.ignored}}`,
                    ]
                ),
            }
        case 'dhis2-analytics-run':
            return {
                subject: subject(i18n.t('dashboards updated')),
                message: body(
                    withPlaceholders(
                        'DHIS2 analytics have been updated by the pipeline "{{pipeline}}". Dashboards and reports now show the latest data.',
                        PIPELINE
                    )
                ),
            }
        case 'alert-generation':
            return {
                subject: subject(i18n.t('alerts generated')),
                message: body(
                    withPlaceholders(
                        'The pipeline "{{pipeline}}" checked the latest values against alert thresholds and generated {{count}} alerts.',
                        { ...PIPELINE, count: '{{input.count}}' }
                    )
                ),
            }
        case 'event-data-upload':
            return {
                subject: subject(i18n.t('alerts sent to DHIS2')),
                message: body(
                    withPlaceholders(
                        'The pipeline "{{pipeline}}" has uploaded new alerts to DHIS2.',
                        PIPELINE
                    ),
                    [
                        `${i18n.t('Created')}: {{input.created}}`,
                        `${i18n.t('Updated')}: {{input.updated}}`,
                    ]
                ),
            }
        case 'climate-openeo-download':
            return {
                subject: subject(i18n.t('climate data ready')),
                message: body(
                    withPlaceholders(
                        'The pipeline "{{pipeline}}" has finished processing {{count}} climate values.',
                        { ...PIPELINE, count: '{{input.count}}' }
                    )
                ),
            }
        default:
            return {
                subject: subject(i18n.t('run update')),
                message: body(
                    withPlaceholders(
                        'The pipeline "{{pipeline}}" has finished the steps before this notification.',
                        PIPELINE
                    )
                ),
            }
    }
}

/** The step that runs right before position `stepOrder`, ignoring the step being edited. */
export function previousStep<T extends Pick<PipelineStep, 'stepOrder'>>(
    steps: T[],
    stepOrder: number
): T | undefined {
    return steps
        .filter((step) => step.stepOrder < stepOrder)
        .sort((a, b) => b.stepOrder - a.stepOrder)[0]
}

export function previousStepHandlerKey(
    steps: Pick<PipelineStep, 'stepOrder' | 'handlerKey'>[],
    stepOrder: number
): string | undefined {
    return previousStep(steps, stepOrder)?.handlerKey
}
