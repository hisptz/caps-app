import { useQuery } from '@tanstack/react-query'
import type { CapsDataEngine } from '@/capsApi/client'
import { getClimateDataset } from '@/capsApi/endpoints'
import { capsKeys } from '@/capsApi/queryKeys'

export function useClimateDatasetDetailQuery(
    engine: CapsDataEngine,
    datasetId: string | undefined
) {
    return useQuery({
        queryKey: capsKeys.climateDatasets.detail(datasetId),
        queryFn: () => getClimateDataset(engine, datasetId!),
        enabled: Boolean(datasetId),
    })
}
