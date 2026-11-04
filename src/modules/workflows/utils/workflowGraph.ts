import i18n from '@dhis2/d2-i18n'
import type {
    PipelineExecutionStatus,
    WorkflowDetail,
} from '@/shared/types/caps'

// ============================================================
// The workflow as a graph: a start node, its pipelines (boxes), its connectors' decisions and
// merges (diamonds), and pipelines outside the workflow that its connectors start. Pure, so
// the canvas only draws what this returns.
// ============================================================

export type WorkflowGraphNodeKind =
    | 'start'
    | 'pipeline'
    | 'merge'
    | 'decision'
    | 'external'

export interface WorkflowGraphNode {
    id: string
    kind: WorkflowGraphNodeKind
    /** Pipeline, merge or connector id; absent for the start node */
    refId?: string
    label: string
}

export type WorkflowGraphEdgeKind =
    | 'start'
    /** A connector that always starts its target: a plain arrow */
    | 'connector'
    /** Into a connector's decision diamond, and out of it to the target or otherwise */
    | 'to-decision'
    | 'yes'
    | 'otherwise'
    | 'merge-in'
    | 'merge-out'

/** Edges that belong to a connector (clicking them shows the connector) */
export const CONNECTOR_EDGE_KINDS: ReadonlySet<WorkflowGraphEdgeKind> = new Set(
    ['connector', 'to-decision', 'yes', 'otherwise']
)

export interface WorkflowGraphEdge {
    id: string
    source: string
    target: string
    kind: WorkflowGraphEdgeKind
    active: boolean
    /** Short text on the line, e.g. "if …", "on failure" */
    label?: string
    /** Connector or merge id */
    refId?: string
}

export const START_NODE_ID = 'start'
export const pipelineNodeId = (id: string) => `pipeline:${id}`
export const mergeNodeId = (id: string) => `merge:${id}`
export const decisionNodeId = (connectorId: string) => `decision:${connectorId}`
const externalNodeId = (id: string) => `external:${id}`

function connectorLabel(connector: {
    on: string
    condition: unknown
    delayMinutes: number
}): string | undefined {
    const parts: string[] = []
    if (connector.on === 'FAILED') {
        parts.push(i18n.t('on failure'))
    } else if (connector.on === 'FINISHED') {
        parts.push(i18n.t('either way'))
    }
    if (connector.delayMinutes > 0) {
        parts.push(
            i18n.t('wait {{minutes}} min', { minutes: connector.delayMinutes })
        )
    }
    return parts.length > 0 ? parts.join(' · ') : undefined
}

export function buildWorkflowGraph(workflow: WorkflowDetail): {
    nodes: WorkflowGraphNode[]
    edges: WorkflowGraphEdge[]
} {
    const members = new Set(workflow.pipelines.map((p) => p.id))
    const nodes: WorkflowGraphNode[] = [
        { id: START_NODE_ID, kind: 'start', label: i18n.t('Start') },
        ...workflow.pipelines.map((p) => ({
            id: pipelineNodeId(p.id),
            kind: 'pipeline' as const,
            refId: p.id,
            label: p.name,
        })),
        ...workflow.merges.map((m) => ({
            id: mergeNodeId(m.id),
            kind: 'merge' as const,
            refId: m.id,
            label: m.name,
        })),
    ]
    const edges: WorkflowGraphEdge[] = workflow.entryPipelineIds.map((id) => ({
        id: `start->${id}`,
        source: START_NODE_ID,
        target: pipelineNodeId(id),
        kind: 'start',
        active: true,
    }))

    // A connector may start a pipeline outside the workflow; it shows as a node of its own
    const nodeFor = (pipeline: { id: string; name?: string }) => {
        if (members.has(pipeline.id)) {
            return pipelineNodeId(pipeline.id)
        }
        const id = externalNodeId(pipeline.id)
        if (!nodes.some((n) => n.id === id)) {
            nodes.push({
                id,
                kind: 'external',
                refId: pipeline.id,
                label: pipeline.name ?? pipeline.id,
            })
        }
        return id
    }

    for (const connector of workflow.connectors) {
        const source = pipelineNodeId(connector.sourcePipelineId)
        const target = nodeFor({
            id: connector.targetPipelineId,
            name: connector.targetPipeline?.name,
        })
        const base = { active: connector.isActive, refId: connector.id }
        const decides =
            (connector.condition !== null &&
                connector.condition !== undefined) ||
            Boolean(connector.otherwisePipelineId)

        // Nothing to decide: a plain arrow
        if (!decides) {
            edges.push({
                ...base,
                id: `connector:${connector.id}`,
                source,
                target,
                kind: 'connector',
                label: connectorLabel(connector),
            })
            continue
        }

        // A decision: arrow into a diamond, then "yes" to the target and "otherwise" out
        const decision = decisionNodeId(connector.id)
        nodes.push({
            id: decision,
            kind: 'decision',
            refId: connector.id,
            label: connector.name,
        })
        edges.push({
            ...base,
            id: `to-decision:${connector.id}`,
            source,
            target: decision,
            kind: 'to-decision',
            label: connectorLabel(connector),
        })
        edges.push({
            ...base,
            id: `yes:${connector.id}`,
            source: decision,
            target,
            kind: 'yes',
            label: connector.otherwisePipelineId ? i18n.t('yes') : undefined,
        })
        if (connector.otherwisePipelineId) {
            edges.push({
                ...base,
                id: `otherwise:${connector.id}`,
                source: decision,
                target: nodeFor({
                    id: connector.otherwisePipelineId,
                    name: connector.otherwisePipeline?.name,
                }),
                kind: 'otherwise',
                label: i18n.t('otherwise'),
            })
        }
    }

    for (const merge of workflow.merges) {
        for (const source of merge.sources) {
            edges.push({
                id: `merge-in:${merge.id}:${source.pipelineId}`,
                source: pipelineNodeId(source.pipelineId),
                target: mergeNodeId(merge.id),
                kind: 'merge-in',
                active: merge.isActive,
                refId: merge.id,
            })
        }
        edges.push({
            id: `merge-out:${merge.id}`,
            source: mergeNodeId(merge.id),
            target: nodeFor({
                id: merge.targetPipelineId,
                name: merge.targetPipeline?.name,
            }),
            kind: 'merge-out',
            active: merge.isActive,
            label:
                merge.condition !== null && merge.condition !== undefined
                    ? i18n.t('if …')
                    : undefined,
            refId: merge.id,
        })
    }

    return { nodes, edges }
}

/** Drawn size of each kind of node; diamonds are small, their name sits underneath. */
export const NODE_SIZE: Record<
    WorkflowGraphNodeKind,
    { w: number; h: number }
> = {
    start: { w: 170, h: 56 },
    pipeline: { w: 220, h: 76 },
    external: { w: 220, h: 76 },
    merge: { w: 44, h: 44 },
    decision: { w: 44, h: 44 },
}

/** Space between columns; wide enough for a diamond's name and an edge label */
export const COLUMN_GAP = 110
export const ROW_GAP = 120

/**
 * Left-to-right positions (top-left corners): a node sits one column right of the furthest node
 * that leads to it; within a column, nodes follow the average height of what leads to them, so
 * lines stay short. Each column is as wide as its widest node, and nodes are centred in it.
 */
export function layoutWorkflowGraph(
    nodes: WorkflowGraphNode[],
    edges: WorkflowGraphEdge[]
): Map<string, { x: number; y: number }> {
    const depth = new Map(nodes.map((n) => [n.id, 0]))
    // Longest path by repeated relaxation; the cap keeps a stray loop from spinning forever
    for (let pass = 0; pass < nodes.length; pass++) {
        let changed = false
        for (const edge of edges) {
            const next = (depth.get(edge.source) ?? 0) + 1
            if (depth.has(edge.target) && next > depth.get(edge.target)!) {
                depth.set(edge.target, next)
                changed = true
            }
        }
        if (!changed) {
            break
        }
    }

    const columns = new Map<number, WorkflowGraphNode[]>()
    for (const node of nodes) {
        const column = depth.get(node.id) ?? 0
        columns.set(column, [...(columns.get(column) ?? []), node])
    }

    // Centres first; turned into top-left corners at the end
    const centres = new Map<string, { x: number; y: number }>()
    let columnX = 0
    for (const column of [...columns.keys()].sort((a, b) => a - b)) {
        const width = Math.max(
            ...columns.get(column)!.map((n) => NODE_SIZE[n.kind].w)
        )
        const parentY = (node: WorkflowGraphNode) => {
            const ys = edges
                .filter((e) => e.target === node.id && centres.has(e.source))
                .map((e) => centres.get(e.source)!.y)
            return ys.length > 0
                ? ys.reduce((sum, y) => sum + y, 0) / ys.length
                : 0
        }
        const ordered = [...columns.get(column)!].sort(
            (a, b) => parentY(a) - parentY(b) || a.label.localeCompare(b.label)
        )
        ordered.forEach((node, index) => {
            centres.set(node.id, {
                x: columnX + width / 2,
                y: (index - (ordered.length - 1) / 2) * ROW_GAP,
            })
        })
        columnX += width + COLUMN_GAP
    }

    const positions = new Map<string, { x: number; y: number }>()
    for (const node of nodes) {
        const centre = centres.get(node.id) ?? { x: 0, y: 0 }
        const { w, h } = NODE_SIZE[node.kind]
        positions.set(node.id, { x: centre.x - w / 2, y: centre.y - h / 2 })
    }
    return positions
}

/** The latest status of each pipeline in a run (a pipeline can run twice in one run). */
export function pipelineStatuses(
    executions: Array<{
        pipeline: { id: string }
        status: PipelineExecutionStatus
    }>
): Map<string, PipelineExecutionStatus> {
    return new Map(executions.map((e) => [e.pipeline.id, e.status]))
}
