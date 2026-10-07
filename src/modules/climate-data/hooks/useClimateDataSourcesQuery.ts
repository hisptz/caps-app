import { useQuery } from '@tanstack/react-query'
import type { CapsDataEngine } from '@/capsApi/client'
import { listClimateDataSources } from '@/capsApi/endpoints'
import { capsKeys } from '@/capsApi/queryKeys'

export function useClimateDataSourcesQuery(engine: CapsDataEngine) {
    return useQuery({
        queryKey: capsKeys.climateDataSources.list(),
        queryFn: () => listClimateDataSources(engine),
        staleTime: 5 * 60 * 1000,
    })
}
