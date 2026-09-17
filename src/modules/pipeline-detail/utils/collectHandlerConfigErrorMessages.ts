import type { FieldError } from 'react-hook-form'

function collectErrorMessages(error: unknown): string[] {
    if (!error || typeof error !== 'object') {
        return []
    }

    const fieldError = error as FieldError
    if (
        typeof fieldError.message === 'string' &&
        fieldError.message.length > 0
    ) {
        return [fieldError.message]
    }

    return Object.values(error as Record<string, unknown>).flatMap(
        collectErrorMessages
    )
}

/** All validation messages under `handlerConfig`, including nested paths. */
export function collectHandlerConfigErrorMessages(
    handlerConfigErrors: unknown
): string[] {
    const messages = collectErrorMessages(handlerConfigErrors)
    return [...new Set(messages)]
}
