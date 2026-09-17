import { useQuery } from '@tanstack/react-query'
import type { CapsDataEngine } from '@/capsApi/client'
import { listModels } from '@/capsApi/endpoints'
import { capsKeys } from '@/capsApi/queryKeys'

export function useModelsQuery(engine: CapsDataEngine) {
    return useQuery({
        queryKey: capsKeys.models(),
        queryFn: () => listModels(engine),
    })
}
