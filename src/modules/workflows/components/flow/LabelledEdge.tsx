import {
    BaseEdge,
    EdgeLabelRenderer,
    getSmoothStepPath,
    useNodes,
    type EdgeProps,
    type Node,
} from '@xyflow/react'
import React, { useMemo } from 'react'
import classes from './Flow.module.css'

export type LabelledEdgeData = { label?: string }

type Box = { left: number; right: number; top: number; bottom: number }

function boxOf(node: Node): Box {
    const width = node.measured?.width ?? node.width ?? node.initialWidth ?? 0
    const height =
        node.measured?.height ?? node.height ?? node.initialHeight ?? 0
    return {
        left: node.position.x,
        right: node.position.x + width,
        top: node.position.y,
        bottom: node.position.y + height,
    }
}

/** How far the detour lane runs below the boxes it passes */
const LANE_GAP = 28
/** Straight run out of the source and into the target before turning */
const STUB = 16
const CORNER = 8

/** A path through the points with rounded corners. */
function roundedPath(points: { x: number; y: number }[]): string {
    let d = `M ${points[0]!.x} ${points[0]!.y}`
    for (let i = 1; i < points.length - 1; i++) {
        const prev = points[i - 1]!
        const at = points[i]!
        const next = points[i + 1]!
        const inLen = Math.hypot(at.x - prev.x, at.y - prev.y)
        const outLen = Math.hypot(next.x - at.x, next.y - at.y)
        const r = Math.min(CORNER, inLen / 2, outLen / 2)
        const before = {
            x: at.x - ((at.x - prev.x) / (inLen || 1)) * r,
            y: at.y - ((at.y - prev.y) / (inLen || 1)) * r,
        }
        const after = {
            x: at.x + ((next.x - at.x) / (outLen || 1)) * r,
            y: at.y + ((next.y - at.y) / (outLen || 1)) * r,
        }
        d += ` L ${before.x} ${before.y} Q ${at.x} ${at.y} ${after.x} ${after.y}`
    }
    const last = points.at(-1)!
    return `${d} L ${last.x} ${last.y}`
}

/**
 * A stepped line whose label sits at its end, just before the arrowhead, instead of on the
 * middle bend; two branches leaving one diamond ("yes", "otherwise") then never share a spot.
 * A line that would pass through other boxes (it skips a column) runs in a lane below them.
 */
export function LabelledEdge(props: EdgeProps): React.ReactElement {
    const { source, target, sourceX, sourceY, targetX, targetY } = props
    const nodes = useNodes()

    const laneY = useMemo(() => {
        const left = Math.min(sourceX, targetX) + STUB
        const right = Math.max(sourceX, targetX) - STUB
        const top = Math.min(sourceY, targetY) - 12
        const bottom = Math.max(sourceY, targetY) + 12
        const blockers = nodes
            .filter((n) => n.id !== source && n.id !== target)
            .map(boxOf)
            .filter(
                (b) =>
                    b.right > left &&
                    b.left < right &&
                    b.bottom > top &&
                    b.top < bottom
            )
        if (blockers.length === 0 && targetX > sourceX) {
            return null
        }
        // Below every box in the way, and below both ends
        return (
            Math.max(
                ...blockers.map((b) => b.bottom),
                sourceY + 24,
                targetY + 24
            ) + LANE_GAP
        )
    }, [nodes, source, target, sourceX, sourceY, targetX, targetY])

    const path =
        laneY === null
            ? getSmoothStepPath(props)[0]
            : roundedPath([
                  { x: sourceX, y: sourceY },
                  { x: sourceX + STUB, y: sourceY },
                  { x: sourceX + STUB, y: laneY },
                  { x: targetX - STUB, y: laneY },
                  { x: targetX - STUB, y: targetY },
                  { x: targetX, y: targetY },
              ])

    const label = (props.data as LabelledEdgeData | undefined)?.label
    return (
        <>
            <BaseEdge
                id={props.id}
                path={path}
                markerEnd={props.markerEnd}
                style={props.style}
                interactionWidth={16}
            />
            {label && (
                <EdgeLabelRenderer>
                    <div
                        className={classes.edgeLabel}
                        style={{
                            transform: `translate(-100%, -100%) translate(${targetX - 14}px, ${targetY - 3}px)`,
                        }}
                    >
                        {label}
                    </div>
                </EdgeLabelRenderer>
            )}
        </>
    )
}

export const flowEdgeTypes = { labelled: LabelledEdge }
