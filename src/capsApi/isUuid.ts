/** Loose UUID check for enabling route-based queries before hitting the API. */
export function isUuid(value: string | undefined): boolean {
    if (!value) {
        return false
    }
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        value
    )
}
