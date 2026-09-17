import { useQuery } from '@tanstack/react-query'
import type { CapsDataEngine } from '@/capsApi/client'
import { listHandlers } from '@/capsApi/endpoints'
import { capsKeys } from '@/capsApi/queryKeys'

/** Worker handler catalog is static; cache indefinitely per session. */
const HANDLERS_STALE_MS = Number.POSITIVE_INFINITY

export function useHandlersQuery(engine: CapsDataEngine) {
    return useQuery({
        queryKey: capsKeys.handlers.all(),
        queryFn: () => listHandlers(engine),
        staleTime: HANDLERS_STALE_MS,
        select: (data) => data.handlers,
    })
}
