import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CapsDataEngine } from '@/capsApi/client'
import {
    deleteInstance,
    getInstance,
    listInstances,
    listAllMappings,
    putInstance,
} from '@/capsApi/endpoints'
import { capsKeys } from '@/capsApi/queryKeys'
import type { PutInstanceBody } from '@/capsApi/types'

export function useInstancesQuery(engine: CapsDataEngine) {
    return useQuery({
        queryKey: capsKeys.instances.list(),
        queryFn: () => listInstances(engine),
    })
}

export function useInstanceQuery(
    engine: CapsDataEngine,
    routeCode: string | undefined
) {
    return useQuery({
        queryKey: capsKeys.instances.detail(routeCode),
        queryFn: () => getInstance(engine, routeCode!),
        enabled: Boolean(routeCode),
    })
}

export function useAllMappingsQuery(engine: CapsDataEngine, enabled = true) {
    return useQuery({
        queryKey: capsKeys.instances.allMappings(),
        queryFn: () => listAllMappings(engine),
        enabled,
    })
}

export function useSaveInstance(engine: CapsDataEngine, routeCode: string) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (body: PutInstanceBody) =>
            putInstance(engine, routeCode, body),
        onSuccess: () =>
            queryClient.invalidateQueries({
                queryKey: capsKeys.instances.all(),
            }),
    })
}

export function useDeleteInstance(engine: CapsDataEngine) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (routeCode: string) => deleteInstance(engine, routeCode),
        onSuccess: () =>
            queryClient.invalidateQueries({
                queryKey: capsKeys.instances.all(),
            }),
    })
}
