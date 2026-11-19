import { CapsApiError } from '@/capsApi/client'

type OcsDetail =
    | string
    | { message?: string; checks?: { checks?: OcsCheck[] } }
    | Array<{ loc?: Array<string | number>; msg?: string }>

type OcsCheck = { id: string; status: string; message: string }

export function ocsErrorMessages(error: unknown): string[] {
    if (!(error instanceof CapsApiError)) {
        return [error instanceof Error ? error.message : String(error)]
    }
    const body = error.body as
        | { error?: string; details?: { detail?: OcsDetail } }
        | undefined
    const detail = body?.details?.detail
    if (typeof detail === 'string') {
        return [detail]
    }
    if (Array.isArray(detail)) {
        const lines = detail
            .map((item) =>
                [
                    item.loc?.filter((part) => part !== 'body').join('.'),
                    item.msg,
                ]
                    .filter(Boolean)
                    .join(': ')
            )
            .filter(Boolean)
        if (lines.length > 0) {
            return lines
        }
    }
    if (detail && typeof detail === 'object' && !Array.isArray(detail)) {
        const failing = (detail.checks?.checks ?? []).filter(
            (check) => check.status === 'fail'
        )
        if (failing.length > 0) {
            return failing.map((check) => check.message)
        }
        if (detail.message) {
            return [detail.message]
        }
    }
    return [body?.error ?? error.message]
}
