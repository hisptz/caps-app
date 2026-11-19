import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CapsDataEngine } from '@/capsApi/client'
import {
    createOcsPipeline,
    dryRunOcsPipeline,
    getOcsPipelineOptions,
    listOcsPipelines,
    setOcsPipelineMode,
    updateOcsPipeline,
} from '@/capsApi/endpoints'
import { capsKeys } from '@/capsApi/queryKeys'
import type {
    OcsDeliveryMode,
    OcsPipelineChangeBody,
    OcsPipelineCreateBody,
} from '@/capsApi/types'

export function useOcsPipelinesQuery(engine: CapsDataEngine) {
    return useQuery({
        queryKey: capsKeys.ocsPipelines.list(),
        queryFn: async () => (await listOcsPipelines(engine)).items,
    })
}

export function useOcsPipelineOptionsQuery(
    engine: CapsDataEngine,
    enabled = true
) {
    return useQuery({
        queryKey: capsKeys.ocsPipelines.options(),
        queryFn: () => getOcsPipelineOptions(engine),
        enabled,
        staleTime: 60_000,
    })
}

export function useOcsPipelineMutations(engine: CapsDataEngine) {
    const queryClient = useQueryClient()
    const invalidate = () =>
        queryClient.invalidateQueries({ queryKey: capsKeys.ocsPipelines.all() })

    const createMutation = useMutation({
        mutationFn: (body: OcsPipelineCreateBody) =>
            createOcsPipeline(engine, body),
        onSuccess: invalidate,
    })
    const updateMutation = useMutation({
        mutationFn: ({
            id,
            body,
        }: {
            id: string
            body: OcsPipelineChangeBody
        }) => updateOcsPipeline(engine, id, body),
        onSuccess: invalidate,
    })
    const dryRunMutation = useMutation({
        mutationFn: ({
            id,
            interval,
        }: {
            id: string
            interval: { start: string; end: string }
        }) => dryRunOcsPipeline(engine, id, interval),
        onSuccess: invalidate,
    })
    const modeMutation = useMutation({
        mutationFn: ({ id, mode }: { id: string; mode: OcsDeliveryMode }) =>
            setOcsPipelineMode(engine, id, mode),
        onSuccess: invalidate,
    })

    return { createMutation, updateMutation, dryRunMutation, modeMutation }
}
