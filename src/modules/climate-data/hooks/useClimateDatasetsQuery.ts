import { useQuery } from '@tanstack/react-query'
import type { CapsDataEngine } from '@/capsApi/client'
import { listClimateDatasets } from '@/capsApi/endpoints'
import { capsKeys } from '@/capsApi/queryKeys'

export function useClimateDatasetsQuery(engine: CapsDataEngine) {
    return useQuery({
        queryKey: capsKeys.climateDatasets.list(),
        queryFn: () => listClimateDatasets(engine),
    })
}
