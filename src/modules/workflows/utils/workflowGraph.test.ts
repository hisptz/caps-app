import {
    buildWorkflowGraph,
    layoutWorkflowGraph,
    mergeNodeId,
    NODE_SIZE,
    pipelineNodeId,
    START_NODE_ID,
} from './workflowGraph'
import type { WorkflowDetail } from '@/shared/types/caps'

function pipeline(id: string) {
    return {
        id,
        name: id,
        description: null,
        isActive: true,
        _count: { steps: 1 },
        steps: [],
    }
}

/**
 * disease + climate -> merge -> prediction; prediction -> (if …) alerts, otherwise report
 * (outside); alerts -> archive (outside) on failure, always
 */
const workflow = {
    id: 'w',
    name: 'Malawi',
    description: null,
    isActive: true,
    cronExpr: null,
    lastRunAt: null,
    nextRunAt: null,
    createdAt: '',
    updatedAt: '',
    pipelines: ['disease', 'climate', 'prediction', 'alerts'].map(pipeline),
    entryPipelineIds: ['disease', 'climate'],
    connectors: [
        {
            id: 'c0',
            name: 'archive failures',
            sourcePipelineId: 'alerts',
            targetPipelineId: 'archive',
            targetPipeline: { id: 'archive', name: 'Archive' },
            otherwisePipelineId: null,
            on: 'FAILED',
            condition: null,
            delayMinutes: 5,
            isActive: true,
        },
        {
            id: 'c1',
            name: 'alert',
            sourcePipelineId: 'prediction',
            targetPipelineId: 'alerts',
            otherwisePipelineId: 'report',
            otherwisePipeline: { id: 'report', name: 'Report' },
            on: 'COMPLETED',
            condition: { '>': [{ var: 'context.x' }, 0] },
            delayMinutes: 0,
            isActive: true,
        },
    ],
    merges: [
        {
            id: 'm1',
            name: 'Both in',
            workflowId: 'w',
            targetPipelineId: 'prediction',
            triggerRule: 'ALL_SUCCEEDED',
            timeoutMinutes: 1440,
            condition: null,
            isActive: true,
            createdAt: '',
            updatedAt: '',
            sources: [
                { mergeId: 'm1', pipelineId: 'disease' },
                { mergeId: 'm1', pipelineId: 'climate' },
            ],
        },
    ],
} as unknown as WorkflowDetail

describe('buildWorkflowGraph', () => {
    it('draws pipelines as boxes and decisions and merges as diamonds', () => {
        const { nodes, edges } = buildWorkflowGraph(workflow)

        expect(nodes.map((n) => [n.id, n.kind])).toEqual([
            [START_NODE_ID, 'start'],
            ['pipeline:disease', 'pipeline'],
            ['pipeline:climate', 'pipeline'],
            ['pipeline:prediction', 'pipeline'],
            ['pipeline:alerts', 'pipeline'],
            ['merge:m1', 'merge'],
            ['external:archive', 'external'],
            ['decision:c1', 'decision'],
            ['external:report', 'external'],
        ])
        expect(edges.map((e) => [e.source, e.target, e.kind, e.label])).toEqual(
            [
                [START_NODE_ID, 'pipeline:disease', 'start', undefined],
                [START_NODE_ID, 'pipeline:climate', 'start', undefined],
                // Nothing to decide: a plain arrow with its timing
                [
                    'pipeline:alerts',
                    'external:archive',
                    'connector',
                    'on failure · wait 5 min',
                ],
                // A condition and an otherwise: through a decision diamond
                [
                    'pipeline:prediction',
                    'decision:c1',
                    'to-decision',
                    undefined,
                ],
                ['decision:c1', 'pipeline:alerts', 'yes', 'yes'],
                ['decision:c1', 'external:report', 'otherwise', 'otherwise'],
                ['pipeline:disease', 'merge:m1', 'merge-in', undefined],
                ['pipeline:climate', 'merge:m1', 'merge-in', undefined],
                ['merge:m1', 'pipeline:prediction', 'merge-out', undefined],
            ]
        )
    })
})

describe('layoutWorkflowGraph', () => {
    const { nodes, edges } = buildWorkflowGraph(workflow)
    const positions = layoutWorkflowGraph(nodes, edges)
    const centre = (id: string) => {
        const { w, h } = NODE_SIZE[nodes.find((n) => n.id === id)!.kind]
        const { x, y } = positions.get(id)!
        return { x: x + w / 2, y: y + h / 2 }
    }

    it('puts each node in a column after the furthest node leading to it', () => {
        const order = [
            START_NODE_ID,
            pipelineNodeId('disease'),
            mergeNodeId('m1'),
            pipelineNodeId('prediction'),
            'decision:c1',
            pipelineNodeId('alerts'),
            'external:archive',
        ].map((id) => centre(id).x)

        expect([...order].sort((a, b) => a - b)).toEqual(order)
        expect(new Set(order).size).toBe(order.length)
        // Same column, same centre line
        expect(centre('external:report').x).toBe(
            centre(pipelineNodeId('alerts')).x
        )
    })

    it('centres each column around the middle, whatever the node size', () => {
        expect(
            centre(pipelineNodeId('disease')).y +
                centre(pipelineNodeId('climate')).y
        ).toBe(0)
        expect(centre(mergeNodeId('m1')).y).toBe(0)
        expect(centre(pipelineNodeId('prediction')).y).toBe(0)
    })
})
