import { useQuery } from '@tanstack/react-query'
import type { CapsDataEngine } from '@/capsApi/client'
import { getPredictionSetup, listEvaluations } from '@/capsApi/endpoints'
import { capsKeys } from '@/capsApi/queryKeys'

export function useEvaluationsQuery(engine: CapsDataEngine) {
    return useQuery({
        queryKey: capsKeys.evaluations(),
        queryFn: () => listEvaluations(engine),
    })
}

export function usePredictionSetupQuery(
    engine: CapsDataEngine,
    id: number | undefined
) {
    return useQuery({
        queryKey: capsKeys.predictionSetup(id),
        queryFn: () => getPredictionSetup(engine, id as number),
        enabled: typeof id === 'number',
    })
}
