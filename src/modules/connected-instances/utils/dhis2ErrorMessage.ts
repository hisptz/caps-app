type ErrorReport = { message?: string }

type Dhis2ErrorDetails = {
    message?: string
    response?: {
        errorReports?: ErrorReport[]
        typeReports?: Array<{
            objectReports?: Array<{ errorReports?: ErrorReport[] }>
        }>
    }
}

export function dhis2ErrorMessage(error: unknown, fallback: string): string {
    if (typeof error !== 'object' || error === null) {
        return fallback
    }
    const details = (error as { details?: Dhis2ErrorDetails }).details
    const reports = [
        ...(details?.response?.errorReports ?? []),
        ...(details?.response?.typeReports ?? []).flatMap((type) =>
            (type.objectReports ?? []).flatMap((o) => o.errorReports ?? [])
        ),
    ]
    const reported = reports.find((r) => r.message)?.message
    if (reported) {
        return reported
    }
    if (details?.message) {
        return details.message
    }
    const message = (error as { message?: unknown }).message
    return typeof message === 'string' && message.trim() ? message : fallback
}
