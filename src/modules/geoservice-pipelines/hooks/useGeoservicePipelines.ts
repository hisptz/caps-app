import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CapsDataEngine } from '@/capsApi/client'
import {
    createGeoservicePipeline,
    dryRunGeoservicePipeline,
    getGeoservicePipelineOptions,
    listGeoservicePipelines,
    setGeoservicePipelineMode,
    updateGeoservicePipeline,
} from '@/capsApi/endpoints'
import { capsKeys } from '@/capsApi/queryKeys'
import type {
    GeoserviceDeliveryMode,
    GeoservicePipelineChangeBody,
    GeoservicePipelineCreateBody,
} from '@/capsApi/types'

export function useGeoservicePipelinesQuery(engine: CapsDataEngine) {
    return useQuery({
        queryKey: capsKeys.geoservicePipelines.list(),
        queryFn: async () => (await listGeoservicePipelines(engine)).items,
    })
}

export function useGeoservicePipelineOptionsQuery(
    engine: CapsDataEngine,
    enabled = true
) {
    return useQuery({
        queryKey: capsKeys.geoservicePipelines.options(),
        queryFn: () => getGeoservicePipelineOptions(engine),
        enabled,
        staleTime: 60_000,
    })
}

export function useGeoservicePipelineMutations(engine: CapsDataEngine) {
    const queryClient = useQueryClient()
    const invalidate = () =>
        queryClient.invalidateQueries({
            queryKey: capsKeys.geoservicePipelines.all(),
        })

    const createMutation = useMutation({
        mutationFn: (body: GeoservicePipelineCreateBody) =>
            createGeoservicePipeline(engine, body),
        onSuccess: invalidate,
    })
    const updateMutation = useMutation({
        mutationFn: ({
            id,
            body,
        }: {
            id: string
            body: GeoservicePipelineChangeBody
        }) => updateGeoservicePipeline(engine, id, body),
        onSuccess: invalidate,
    })
    const dryRunMutation = useMutation({
        mutationFn: ({
            id,
            interval,
        }: {
            id: string
            interval: { start: string; end: string }
        }) => dryRunGeoservicePipeline(engine, id, interval),
        onSuccess: invalidate,
    })
    const modeMutation = useMutation({
        mutationFn: ({
            id,
            mode,
        }: {
            id: string
            mode: GeoserviceDeliveryMode
        }) => setGeoservicePipelineMode(engine, id, mode),
        onSuccess: invalidate,
    })

    return { createMutation, updateMutation, dryRunMutation, modeMutation }
}
