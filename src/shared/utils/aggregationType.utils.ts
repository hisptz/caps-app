const LEGACY_AGGREGATION_TYPES: Record<string, string> = {
    MEAN: 'AVERAGE',
}

export function normalizeAggregationType(
    value: unknown,
    fallback: string
): string {
    if (typeof value !== 'string' || !value.trim()) {
        return fallback
    }
    const upper = value.trim().toUpperCase()
    return LEGACY_AGGREGATION_TYPES[upper] ?? upper
}
