import type { DataItemType } from './DataItemOption'

export type DataElementRow = {
    id: string
    displayName: string
    dimensionItemType?: DataItemType
}

export function mergeDataElementOptions(
    paged: DataElementRow[],
    selected: DataElementRow[]
): Array<{ value: string; label: string; type?: DataItemType }> {
    const seen = new Set<string>()
    const merged: DataElementRow[] = []

    for (const row of [...selected, ...paged]) {
        if (seen.has(row.id)) {
            continue
        }
        seen.add(row.id)
        merged.push(row)
    }

    return merged
        .sort((a, b) => a.displayName.localeCompare(b.displayName))
        .map((de) => ({
            value: de.id,
            label: de.displayName,
            type: de.dimensionItemType,
        }))
}
