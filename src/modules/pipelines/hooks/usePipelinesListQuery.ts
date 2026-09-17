import { useQuery } from '@tanstack/react-query'
import type { CapsDataEngine } from '@/capsApi/client'
import { listPipelines } from '@/capsApi/endpoints'
import { capsKeys } from '@/capsApi/queryKeys'

export function usePipelinesListQuery(
    engine: CapsDataEngine,
    page: number,
    pageSize: number
) {
    return useQuery({
        queryKey: capsKeys.pipelines.list(page, pageSize),
        queryFn: () => listPipelines(engine, { page, pageSize }),
    })
}
