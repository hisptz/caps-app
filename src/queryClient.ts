// QueryClient is exported from @tanstack/react-query via query-core; eslint import/named does not resolve the re-export.
// eslint-disable-next-line import/named
import { QueryClient } from '@tanstack/react-query'

const DEFAULT_STALE_MS = 1000 * 60 * 5

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: DEFAULT_STALE_MS,
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
})
