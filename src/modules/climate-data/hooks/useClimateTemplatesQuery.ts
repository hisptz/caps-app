import { useQuery } from '@tanstack/react-query'
import type { CapsDataEngine } from '@/capsApi/client'
import { listClimateDatasetTemplates } from '@/capsApi/endpoints'
import { capsKeys } from '@/capsApi/queryKeys'

export function useClimateTemplatesQuery(engine: CapsDataEngine) {
    return useQuery({
        queryKey: capsKeys.climateTemplates.list(),
        queryFn: () => listClimateDatasetTemplates(engine),
        staleTime: 5 * 60 * 1000,
    })
}
