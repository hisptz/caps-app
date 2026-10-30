import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CapsDataEngine } from '@/capsApi/client'
import {
    cancelConnectorRun,
    createConnector,
    deleteConnector,
    listConnectorRuns,
    listPipelineConnectors,
    listPipelines,
    updateConnector,
} from '@/capsApi/endpoints'
import { capsKeys } from '@/capsApi/queryKeys'
import type { CreateConnectorBody, UpdateConnectorBody } from '@/capsApi/types'

export function usePipelineConnectorsQuery(
    engine: CapsDataEngine,
    pipelineId: string | undefined,
    enabled: boolean
) {
    return useQuery({
        queryKey: capsKeys.connectors.byPipeline(pipelineId),
        queryFn: () => listPipelineConnectors(engine, pipelineId!),
        enabled: enabled && Boolean(pipelineId),
        select: (connectors) => ({
            outgoing: connectors.filter(
                (l) => l.sourcePipelineId === pipelineId
            ),
            // Includes connectors that start this pipeline only when their rule is not met
            incoming: connectors.filter(
                (l) =>
                    (l.targetPipelineId === pipelineId ||
                        l.otherwisePipelineId === pipelineId) &&
                    l.sourcePipelineId !== pipelineId
            ),
        }),
    })
}

/** Pipelines a connector can target (same list the executions filter uses). */
export function useConnectorTargetOptionsQuery(
    engine: CapsDataEngine,
    enabled: boolean
) {
    return useQuery({
        queryKey: capsKeys.pipelines.filterOptions(),
        queryFn: () => listPipelines(engine, { page: 1, pageSize: 100 }),
        enabled,
    })
}

export function useConnectorRunsQuery(
    engine: CapsDataEngine,
    connectorId: string | undefined,
    paging: { page: number; pageSize: number }
) {
    const { page, pageSize } = paging
    return useQuery({
        queryKey: capsKeys.connectors.runs(connectorId ?? '', page, pageSize),
        queryFn: () =>
            listConnectorRuns(engine, connectorId!, { page, pageSize }),
        enabled: Boolean(connectorId),
    })
}

export function useConnectorMutations(engine: CapsDataEngine) {
    const queryClient = useQueryClient()
    // A connector shows on both its pipelines, so refresh every connectors query
    const invalidateConnectors = () =>
        queryClient.invalidateQueries({ queryKey: capsKeys.connectors.all() })

    const createConnectorMutation = useMutation({
        mutationFn: (body: CreateConnectorBody) =>
            createConnector(engine, body),
        onSuccess: invalidateConnectors,
    })

    const updateConnectorMutation = useMutation({
        mutationFn: ({
            connectorId,
            body,
        }: {
            connectorId: string
            body: UpdateConnectorBody
        }) => updateConnector(engine, connectorId, body),
        onSuccess: invalidateConnectors,
    })

    const deleteConnectorMutation = useMutation({
        mutationFn: (connectorId: string) =>
            deleteConnector(engine, connectorId),
        onSuccess: invalidateConnectors,
    })

    const cancelConnectorRunMutation = useMutation({
        mutationFn: (connectorRunId: string) =>
            cancelConnectorRun(engine, connectorRunId),
        onSuccess: invalidateConnectors,
    })

    return {
        createConnectorMutation,
        updateConnectorMutation,
        deleteConnectorMutation,
        cancelConnectorRunMutation,
    }
}
