import '@xyflow/react/dist/style.css'
import i18n from '@dhis2/d2-i18n'
import {
    Background,
    BackgroundVariant,
    Controls,
    MarkerType,
    MiniMap,
    ReactFlow,
    useReactFlow,
    type Edge,
    type Node,
} from '@xyflow/react'
import React, { useEffect, useMemo, useRef } from 'react'
import classes from './Flow.module.css'
import { flowNodeTypes, type FlowNodeData } from './FlowNodes'
import {
    connectorFlowStatus,
    mergeFlowStatus,
    pipelineFlowStatus,
} from './flowStatus'
import { flowEdgeTypes } from './LabelledEdge'
import {
    buildWorkflowGraph,
    CONNECTOR_EDGE_KINDS,
    decisionNodeId,
    layoutWorkflowGraph,
    NODE_SIZE,
    pipelineStatuses,
    type WorkflowGraphEdge,
    type WorkflowGraphEdgeKind,
    type WorkflowGraphNode,
} from '@/modules/workflows/utils/workflowGraph'
import {
    describeWorkflowSchedule,
    formatMergeRule,
} from '@/modules/workflows/utils/workflowLabels'
import type { WorkflowDetail, WorkflowRunDetail } from '@/shared/types/caps'

type Props = {
    workflow: WorkflowDetail
    /** Colours the nodes; absent before the first run */
    latestRun?: WorkflowRunDetail
    selectedNodeId: string | null
    onSelect: (node: WorkflowGraphNode | null) => void
    toolbar?: React.ReactNode
    /** Floats over the canvas on the right, e.g. the selected box's details */
    panel?: React.ReactNode
    /** Floats over the canvas under the toolbar, e.g. the Add pipeline picker */
    overlay?: React.ReactNode
    /** Shown instead of the diagram while the workflow has no pipelines */
    emptyState?: React.ReactNode
}

const EDGE_COLOR: Record<WorkflowGraphEdgeKind, string> = {
    start: '#212934',
    connector: '#4a5768',
    'to-decision': '#4a5768',
    yes: '#4a5768',
    otherwise: '#7b8998',
    'merge-in': '#4a5768',
    'merge-out': '#4a5768',
}

function nodeData(
    node: WorkflowGraphNode,
    workflow: WorkflowDetail,
    latestRun: WorkflowRunDetail | undefined
): FlowNodeData {
    const statuses = latestRun
        ? pipelineStatuses(latestRun.executions)
        : undefined
    switch (node.kind) {
        case 'start':
            return {
                caption: i18n.t('Start'),
                name: workflow.cronExpr
                    ? i18n.t('Schedule')
                    : i18n.t('Trigger button'),
                detail: workflow.cronExpr ?? undefined,
                inactive: !workflow.isActive,
            }
        case 'pipeline': {
            const pipeline = workflow.pipelines.find((p) => p.id === node.refId)
            return {
                caption: workflow.entryPipelineIds.includes(node.refId!)
                    ? i18n.t('Starts the execution')
                    : i18n.t('Pipeline'),
                name: node.label,
                detail: i18n.t('{{steps}} steps', {
                    steps: pipeline?._count.steps ?? 0,
                }),
                status: latestRun
                    ? pipelineFlowStatus(statuses?.get(node.refId!))
                    : undefined,
                inactive: pipeline?.isActive === false,
            }
        }
        case 'decision': {
            const connector = workflow.connectors.find(
                (c) => c.id === node.refId
            )
            const run = latestRun?.connectorRuns
                .filter((r) => r.connectorId === node.refId)
                .at(-1)
            return {
                caption: i18n.t('Connector'),
                name: node.label,
                status: latestRun ? connectorFlowStatus(run) : undefined,
                inactive: connector?.isActive === false,
            }
        }
        case 'merge': {
            const merge = workflow.merges.find((m) => m.id === node.refId)
            const run = latestRun?.mergeRuns.find(
                (r) => r.merge.id === node.refId
            )
            return {
                caption: i18n.t('Connector · waits for all'),
                name: node.label,
                detail: merge ? formatMergeRule(merge) : undefined,
                status: latestRun
                    ? mergeFlowStatus(
                          run?.status,
                          run?.arrivals.length ?? 0,
                          merge?.sources.length ?? 0
                      )
                    : undefined,
                inactive: merge?.isActive === false,
            }
        }
        case 'external':
            return {
                caption: i18n.t('Outside this workflow'),
                name: node.label,
            }
    }
}

function edgeStyle(edge: WorkflowGraphEdge, running: boolean): Partial<Edge> {
    const color = EDGE_COLOR[edge.kind]
    return {
        type: 'labelled',
        animated: running,
        data: { label: edge.label },
        markerEnd: {
            type: MarkerType.ArrowClosed,
            color,
            width: 16,
            height: 16,
        },
        style: {
            stroke: color,
            strokeWidth: 1.6,
            strokeDasharray: edge.kind === 'otherwise' ? '6 4' : undefined,
            opacity: edge.active ? 1 : 0.35,
        },
    }
}

/** Larger workflows get a minimap to find your way around */
const MINIMAP_FROM_NODES = 7

/** Fitting never zooms out further than this, so box text stays readable */
const READABLE_ZOOM = 0.7

/** Re-fit the diagram when the canvas changes size (e.g. the side panel opens) or boxes change. */
function FitOnResize({
    container,
    nodeCount,
    panelOpen,
}: {
    container: React.RefObject<HTMLDivElement | null>
    nodeCount: number
    /** Leaves room on the right so the floating panel covers no box */
    panelOpen: boolean
}): null {
    const { fitView } = useReactFlow()
    useEffect(() => {
        const element = container.current
        if (!element) {
            return
        }
        let frame = 0
        const refit = () => {
            cancelAnimationFrame(frame)
            frame = requestAnimationFrame(() =>
                fitView({
                    padding: panelOpen
                        ? {
                              top: '40px',
                              bottom: '40px',
                              left: '24px',
                              right: '350px',
                          }
                        : 0.25,
                    maxZoom: 1.1,
                    // Text stays readable; a wider workflow is panned, with the minimap to help
                    minZoom: READABLE_ZOOM,
                    duration: 200,
                })
            )
        }
        const observer = new ResizeObserver(refit)
        observer.observe(element)
        refit()
        return () => {
            observer.disconnect()
            cancelAnimationFrame(frame)
        }
    }, [container, fitView, nodeCount, panelOpen])
    return null
}

/** The workflow as boxes and arrows, coloured by its latest run. */
export function WorkflowFlow({
    workflow,
    latestRun,
    selectedNodeId,
    onSelect,
    toolbar,
    panel,
    overlay,
    emptyState,
}: Props): React.ReactElement {
    const canvasRef = useRef<HTMLDivElement>(null)
    const graph = useMemo(() => buildWorkflowGraph(workflow), [workflow])
    const positions = useMemo(
        () => layoutWorkflowGraph(graph.nodes, graph.edges),
        [graph]
    )

    const nodes: Node[] = useMemo(
        () =>
            graph.nodes.map((node) => ({
                id: node.id,
                type: node.kind,
                position: positions.get(node.id) ?? { x: 0, y: 0 },
                // Known sizes, so the minimap and fitting work before React Flow measures
                initialWidth: NODE_SIZE[node.kind].w,
                initialHeight: NODE_SIZE[node.kind].h,
                data: nodeData(node, workflow, latestRun),
                selected: node.id === selectedNodeId,
                draggable: false,
            })),
        [graph, positions, workflow, latestRun, selectedNodeId]
    )

    const runningNodes = useMemo(
        () =>
            new Set(
                nodes
                    .filter(
                        (n) =>
                            (n.data as FlowNodeData).status?.tone ===
                            classes.running
                    )
                    .map((n) => n.id)
            ),
        [nodes]
    )

    const edges: Edge[] = useMemo(
        () =>
            graph.edges.map((edge) => ({
                id: edge.id,
                source: edge.source,
                target: edge.target,
                ...edgeStyle(edge, runningNodes.has(edge.target)),
            })),
        [graph, runningNodes]
    )

    if (workflow.pipelines.length === 0 && emptyState) {
        return (
            <div className={`${classes.canvas} ${classes.emptyCanvas}`}>
                {toolbar && <div className={classes.toolbar}>{toolbar}</div>}
                {overlay}
                <div className={classes.empty}>{emptyState}</div>
                <div className={classes.legend} aria-hidden>
                    <span>{describeWorkflowSchedule(workflow)}</span>
                </div>
            </div>
        )
    }

    return (
        <div className={classes.canvas} ref={canvasRef}>
            {toolbar && <div className={classes.toolbar}>{toolbar}</div>}
            {panel}
            {overlay}
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={flowNodeTypes}
                edgeTypes={flowEdgeTypes}
                fitView
                fitViewOptions={{
                    padding: 0.25,
                    maxZoom: 1.1,
                    minZoom: READABLE_ZOOM,
                }}
                minZoom={0.3}
                maxZoom={1.6}
                nodesConnectable={false}
                elementsSelectable
                proOptions={{ hideAttribution: true }}
                onNodeClick={(_, node) =>
                    onSelect(graph.nodes.find((n) => n.id === node.id) ?? null)
                }
                onEdgeClick={(_, edge) => {
                    // Any arrow of a connector shows that connector
                    const graphEdge = graph.edges.find((e) => e.id === edge.id)
                    if (
                        graphEdge?.refId &&
                        CONNECTOR_EDGE_KINDS.has(graphEdge.kind)
                    ) {
                        const connector = workflow.connectors.find(
                            (c) => c.id === graphEdge.refId
                        )
                        onSelect({
                            id: decisionNodeId(graphEdge.refId),
                            kind: 'decision',
                            refId: graphEdge.refId,
                            label: connector?.name ?? '',
                        })
                    }
                }}
                onPaneClick={() => onSelect(null)}
            >
                <Background
                    variant={BackgroundVariant.Dots}
                    gap={18}
                    size={1}
                />
                <Controls showInteractive={false} position="bottom-right" />
                {graph.nodes.length > MINIMAP_FROM_NODES && (
                    <MiniMap
                        position="bottom-right"
                        className={classes.minimap}
                        style={{ marginRight: 56, width: 160, height: 100 }}
                        nodeColor="#8194a9"
                        bgColor="#ffffff"
                        maskColor="rgba(251, 252, 253, 0.7)"
                        pannable
                        zoomable
                        ariaLabel={i18n.t('Overview of the whole workflow')}
                    />
                )}
                <FitOnResize
                    container={canvasRef}
                    nodeCount={nodes.length}
                    panelOpen={Boolean(panel)}
                />
            </ReactFlow>
            <div className={classes.legend} aria-hidden>
                <span className={classes.legendItem}>
                    <span
                        className={classes.dot}
                        style={{ background: '#1b7d3d' }}
                    />
                    {i18n.t('Succeeded')}
                </span>
                <span className={classes.legendItem}>
                    <span
                        className={classes.dot}
                        style={{ background: '#147cd7' }}
                    />
                    {i18n.t('Running')}
                </span>
                <span className={classes.legendItem}>
                    <span
                        className={classes.dot}
                        style={{ background: '#e4a400' }}
                    />
                    {i18n.t('Waiting')}
                </span>
                <span className={classes.legendItem}>
                    <span
                        className={classes.dot}
                        style={{ background: '#c62828' }}
                    />
                    {i18n.t('Failed')}
                </span>
                <span>{describeWorkflowSchedule(workflow)}</span>
            </div>
        </div>
    )
}
