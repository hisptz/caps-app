import {
    BaseEdge,
    EdgeLabelRenderer,
    getSmoothStepPath,
    type EdgeProps,
} from '@xyflow/react'
import React from 'react'
import classes from './Flow.module.css'

export type LabelledEdgeData = { label?: string }

/**
 * A stepped line whose label sits at its end, just before the arrowhead, instead of on the
 * middle bend; two branches leaving one diamond ("yes", "otherwise") then never share a spot.
 */
export function LabelledEdge(props: EdgeProps): React.ReactElement {
    const [path] = getSmoothStepPath(props)
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
                            transform: `translate(-100%, -100%) translate(${props.targetX - 14}px, ${props.targetY - 3}px)`,
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
