export function formatDate(iso: string | null): string {
    if (!iso) {
        return '—'
    }
    return new Date(iso).toLocaleString()
}

export function durationLabel(
    startedAt: string | null,
    finishedAt: string | null
): string {
    if (!startedAt) {
        return '—'
    }
    const end = finishedAt ? new Date(finishedAt) : new Date()
    const secs = Math.round(
        (end.getTime() - new Date(startedAt).getTime()) / 1000
    )
    if (secs < 60) {
        return `${secs}s`
    }
    return `${Math.floor(secs / 60)}m ${secs % 60}s`
}
