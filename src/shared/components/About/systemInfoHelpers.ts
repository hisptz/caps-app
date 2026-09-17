export const formatWhenPresent = (value: string | undefined) => {
    if (!value) {
        return undefined
    }
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? value : d.toLocaleString()
}

export const shortRevision = (rev: string | undefined) => {
    if (!rev) {
        return undefined
    }
    return rev.length > 12 ? `${rev.slice(0, 12)}…` : rev
}

export function filterDetailRows(
    rows: { label: string; value: string | undefined }[]
): { label: string; value: string }[] {
    return rows.filter(
        (r): r is { label: string; value: string } =>
            r.value !== undefined && r.value !== ''
    )
}
