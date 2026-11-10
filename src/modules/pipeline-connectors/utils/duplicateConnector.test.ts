import { findDuplicateConnector } from './duplicateConnector'
import type { PipelineConnector } from '@/shared/types/caps'

function connector(
    id: string,
    [source, target]: [string, string],
    on: PipelineConnector['on'] = 'COMPLETED'
): PipelineConnector {
    return {
        id,
        name: id,
        description: null,
        sourcePipelineId: source,
        targetPipelineId: target,
        otherwisePipelineId: null,
        on,
        condition: null,
        inputMapping: {},
        delayMinutes: 0,
        isActive: true,
        createdAt: '',
        updatedAt: '',
    }
}

const existing = [
    connector('c1', ['analytics', 'prediction']),
    connector('c2', ['check', 'hmis'], 'FAILED'),
]

describe('findDuplicateConnector', () => {
    it('finds a connector with the same source, target and trigger', () => {
        expect(
            findDuplicateConnector(
                {
                    sourcePipelineId: 'analytics',
                    targetPipelineId: 'prediction',
                    on: 'COMPLETED',
                },
                existing
            )?.id
        ).toBe('c1')
    })

    it('treats "when it finishes" as overlapping success and failure', () => {
        expect(
            findDuplicateConnector(
                {
                    sourcePipelineId: 'check',
                    targetPipelineId: 'hmis',
                    on: 'FINISHED',
                },
                existing
            )?.id
        ).toBe('c2')
    })

    it('allows the same target on a trigger that does not overlap', () => {
        expect(
            findDuplicateConnector(
                {
                    sourcePipelineId: 'check',
                    targetPipelineId: 'hmis',
                    on: 'COMPLETED',
                },
                existing
            )
        ).toBeUndefined()
    })

    it('allows the same target from another source', () => {
        expect(
            findDuplicateConnector(
                {
                    sourcePipelineId: 'precipitation',
                    targetPipelineId: 'prediction',
                    on: 'COMPLETED',
                },
                existing
            )
        ).toBeUndefined()
    })

    it('ignores the connector being edited', () => {
        expect(
            findDuplicateConnector(
                {
                    sourcePipelineId: 'analytics',
                    targetPipelineId: 'prediction',
                    on: 'COMPLETED',
                },
                existing,
                'c1'
            )
        ).toBeUndefined()
    })
})
