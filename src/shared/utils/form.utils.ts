import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import type { ZodError } from 'zod'

/**
 * Maps a zod SafeParseError's issues onto react-hook-form field errors.
 * Issues with an empty path (root-level refinements) are skipped —
 * callers needing a root error should call setError('root', ...) separately.
 */
export function applyZodErrorsToForm<TFieldValues extends FieldValues>(
    error: ZodError,
    setError: UseFormSetError<TFieldValues>
): void {
    for (const issue of error.issues) {
        const path = issue.path.join('.')
        if (path) {
            setError(path as Path<TFieldValues>, {
                type: 'manual',
                message: issue.message,
            })
        }
    }
}
