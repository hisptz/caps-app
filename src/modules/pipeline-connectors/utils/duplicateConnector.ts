import type { ConnectorTriggerOn, PipelineConnector } from '@/shared/types/caps'

/** "When it finishes" fires on success and on failure, so it overlaps both. */
function triggersOverlap(a: ConnectorTriggerOn, b: ConnectorTriggerOn) {
    return a === b || a === 'FINISHED' || b === 'FINISHED'
}

/**
 * Another connector that already starts the same pipeline from the same source on an
 * overlapping trigger. Saving a second one would start the target twice each time the
 * source finishes, whichever path led to the source.
 */
export function findDuplicateConnector(
    candidate: {
        sourcePipelineId: string
        targetPipelineId: string
        on: ConnectorTriggerOn
    },
    connectors: PipelineConnector[],
    editingId?: string
): PipelineConnector | undefined {
    return connectors.find(
        (c) =>
            c.id !== editingId &&
            c.sourcePipelineId === candidate.sourcePipelineId &&
            c.targetPipelineId === candidate.targetPipelineId &&
            triggersOverlap(c.on, candidate.on)
    )
}
