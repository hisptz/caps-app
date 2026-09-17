import i18n from '@dhis2/d2-i18n'
import type { UseFormSetError } from 'react-hook-form'
import { CapsApiError } from '@/capsApi/client'
import type { PipelineStepFormWithHandlerValues } from '@/modules/pipeline-detail/schemas/stepFormSchema'

type HandlerConfigDetail = { path: string; message: string }

function isHandlerConfigDetails(
    body: unknown
): body is { error: string; details: HandlerConfigDetail[] } {
    return (
        typeof body === 'object' &&
        body !== null &&
        'details' in body &&
        Array.isArray((body as { details: unknown }).details)
    )
}

function pathToFormPath(path: string): string {
    if (path === '' || path === 'handlerConfig') {
        return 'handlerConfig'
    }
    if (path.startsWith('handlerConfig.')) {
        return path
    }
    return `handlerConfig.${path}`
}

export function applyHandlerConfigErrorsToForm(
    body: unknown,
    setError: UseFormSetError<PipelineStepFormWithHandlerValues>
): boolean {
    if (!isHandlerConfigDetails(body)) {
        return false
    }
    let applied = false
    for (const detail of body.details) {
        setError(pathToFormPath(detail.path) as 'handlerConfig', {
            type: 'server',
            message: detail.message,
        })
        applied = true
    }
    return applied
}

/** Map create-step API errors to RHF `setError` targets. */
export function mapCreateStepMutationError(
    err: unknown,
    stepOrder: number
): {
    stepOrderMessage: string | null
    rootMessage: string | null
    handlerConfigMapped: boolean
} {
    if (err instanceof CapsApiError && err.status === 409) {
        return {
            stepOrderMessage: i18n.t(
                'Step order {{order}} is already taken for this pipeline.',
                { order: stepOrder }
            ),
            rootMessage: null,
            handlerConfigMapped: false,
        }
    }
    if (err instanceof CapsApiError) {
        const handlerConfigMapped = isHandlerConfigDetails(err.body)
        return {
            stepOrderMessage: null,
            rootMessage: handlerConfigMapped ? null : err.message,
            handlerConfigMapped,
        }
    }
    return {
        stepOrderMessage: null,
        rootMessage: i18n.t('Could not create step. Try again.'),
        handlerConfigMapped: false,
    }
}

export function mapUpdateStepMutationError(err: unknown): {
    message: string | null
    handlerConfigMapped: boolean
} {
    if (err instanceof CapsApiError) {
        const handlerConfigMapped = isHandlerConfigDetails(err.body)
        return {
            message: handlerConfigMapped ? null : err.message,
            handlerConfigMapped,
        }
    }
    return {
        message: i18n.t('Could not update step. Try again.'),
        handlerConfigMapped: false,
    }
}
