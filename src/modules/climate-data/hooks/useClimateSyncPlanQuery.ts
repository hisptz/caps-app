import { useQuery } from '@tanstack/react-query'
import type { CapsDataEngine } from '@/capsApi/client'
import { getClimateSyncPlan } from '@/capsApi/endpoints'
import { capsKeys } from '@/capsApi/queryKeys'

export function useClimateSyncPlanQuery(
    engine: CapsDataEngine,
    datasetId: string | undefined
) {
    return useQuery({
        queryKey: capsKeys.climateSyncPlans.detail(datasetId),
        queryFn: () => getClimateSyncPlan(engine, datasetId!),
        enabled: Boolean(datasetId),
    })
}
