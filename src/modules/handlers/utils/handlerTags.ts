const TAG_ALIASES: Record<string, string> = {
    climate: 'ocs',
    prediction: 'chap',
}

export type HandlerTagTone =
    | 'blue'
    | 'green'
    | 'purple'
    | 'red'
    | 'yellow'
    | 'neutral'

const TAG_TONES: Record<string, HandlerTagTone> = {
    dhis2: 'blue',
    ocs: 'green',
    chap: 'purple',
    threshold: 'red',
    alert: 'yellow',
}

export function toHandlerTagLabel(tag: string): string {
    return TAG_ALIASES[tag.toLowerCase()] ?? tag
}

export function toHandlerTagLabels(tags: string[] | undefined): string[] {
    const seen = new Set<string>()
    const labels: string[] = []
    for (const tag of tags ?? []) {
        const label = toHandlerTagLabel(tag)
        if (!label || seen.has(label)) {
            continue
        }
        seen.add(label)
        labels.push(label)
    }
    return labels
}

export function getHandlerTagTone(label: string): HandlerTagTone {
    return TAG_TONES[label.toLowerCase()] ?? 'neutral'
}
