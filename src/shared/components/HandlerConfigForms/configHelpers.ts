/** Read a nested value from a config object by dot-separated path. */
export function get(obj: Record<string, unknown> | null, path: string): string {
    if (!obj) {
        return ''
    }
    const parts = path.split('.')
    let cur: unknown = obj
    for (const p of parts) {
        if (typeof cur !== 'object' || cur === null) {
            return ''
        }
        cur = (cur as Record<string, unknown>)[p]
    }
    return typeof cur === 'string' || typeof cur === 'number' ? String(cur) : ''
}

/** Immutably set a nested value in a config object by dot-separated path. */
export function set(
    obj: Record<string, unknown> | null,
    path: string,
    val: unknown
): Record<string, unknown> {
    const base: Record<string, unknown> = obj ? { ...obj } : {}
    const parts = path.split('.')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let cur: any = base
    for (let i = 0; i < parts.length - 1; i++) {
        const p = parts[i]
        cur[p] =
            typeof cur[p] === 'object' && cur[p] !== null
                ? { ...(cur[p] as Record<string, unknown>) }
                : {}
        cur = cur[p]
    }
    cur[parts[parts.length - 1]] = val
    return base
}
