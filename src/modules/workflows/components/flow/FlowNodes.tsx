import i18n from '@dhis2/d2-i18n'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import React from 'react'
import classes from './Flow.module.css'
import type { FlowStatus } from './flowStatus'

export type FlowNodeData = {
    caption: string
    name: string
    detail?: string
    status?: FlowStatus
    inactive?: boolean
}

function className(...names: Array<string | false | undefined>): string {
    return names.filter(Boolean).join(' ')
}

function Body({ data }: { data: FlowNodeData }): React.ReactElement {
    return (
        <>
            <span className={classes.caption}>{data.caption}</span>
            <span className={classes.name} title={data.name}>
                {data.name}
            </span>
            {(data.detail || data.status) && (
                <span className={classes.meta}>
                    <span>{data.detail}</span>
                    {data.status && (
                        <span className={classes.status}>
                            <span className={classes.dot} aria-hidden />
                            {data.status.label}
                        </span>
                    )}
                </span>
            )}
        </>
    )
}

function Handles({
    target = true,
    source = true,
}: {
    target?: boolean
    source?: boolean
}): React.ReactElement {
    return (
        <>
            {target && (
                <Handle
                    type="target"
                    position={Position.Left}
                    className={classes.handle}
                    isConnectable={false}
                />
            )}
            {source && (
                <Handle
                    type="source"
                    position={Position.Right}
                    className={classes.handle}
                    isConnectable={false}
                />
            )}
        </>
    )
}

type Props = NodeProps & { data: FlowNodeData }

function nodeClass(props: Props, kind: string | undefined): string {
    return className(
        classes.node,
        kind,
        props.data.status?.tone,
        props.data.inactive && classes.inactive,
        props.selected && classes.selected
    )
}

export function PipelineFlowNode(props: Props): React.ReactElement {
    return (
        <div className={nodeClass(props, undefined)}>
            <Handles />
            <Body data={props.data} />
        </div>
    )
}

/** A connector's decision (?) or a merge (+): a small diamond with its name underneath. */
function GatewayNode({
    props,
    symbol,
}: {
    props: Props
    symbol: string
}): React.ReactElement {
    return (
        <div
            className={className(
                classes.gateway,
                props.data.status?.tone,
                props.data.inactive && classes.inactive,
                props.selected && classes.selected
            )}
            title={props.data.caption}
        >
            <Handles />
            <span className={classes.diamond} aria-hidden />
            <span className={classes.symbol} aria-hidden>
                {symbol}
            </span>
            <span className={classes.gatewayLabel}>
                <span className={classes.gatewayName}>{props.data.name}</span>
                {props.data.status && (
                    <span className={classes.status}>
                        <span className={classes.dot} aria-hidden />
                        {props.data.status.label}
                    </span>
                )}
            </span>
        </div>
    )
}

export function MergeFlowNode(props: Props): React.ReactElement {
    return <GatewayNode props={props} symbol="+" />
}

export function DecisionFlowNode(props: Props): React.ReactElement {
    return <GatewayNode props={props} symbol="?" />
}

export function StartFlowNode(props: Props): React.ReactElement {
    return (
        <div className={nodeClass(props, classes.start)}>
            <Handles target={false} />
            <Body data={props.data} />
        </div>
    )
}

export function ExternalFlowNode(props: Props): React.ReactElement {
    return (
        <div
            className={nodeClass(props, classes.external)}
            title={i18n.t('Outside this workflow')}
        >
            <Handles source={false} />
            <Body data={props.data} />
        </div>
    )
}

export const flowNodeTypes = {
    pipeline: PipelineFlowNode,
    merge: MergeFlowNode,
    decision: DecisionFlowNode,
    start: StartFlowNode,
    external: ExternalFlowNode,
}
