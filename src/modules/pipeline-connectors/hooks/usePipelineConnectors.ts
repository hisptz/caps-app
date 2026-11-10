import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CapsDataEngine } from '@/capsApi/client'
import {
    cancelConnectorRun,
    createConnector,
    deleteConnector,
    listConnectorRuns,
    listPipelines,
    updateConnector,
} from '@/capsApi/endpoints'
import { capsKeys } from '@/capsApi/queryKeys'
import type { CreateConnectorBody, UpdateConnectorBody } from '@/capsApi/types'

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
