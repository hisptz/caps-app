import { useDataEngine } from '@dhis2/app-runtime'
import {
    useMutation,
    useQueries,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query'
import { testSourceRoute } from '@/capsApi/endpoints'
import { SOURCE_ROUTE_CODE_PREFIX } from '@/modules/connected-instances/constants'
import {
    buildSourceRouteCreatePayload,
    buildSourceRoutePatch,
    type SourceRoute,
    type SourceRouteFormValues,
} from '@/modules/connected-instances/schemas/routeForm'

export const sourceRouteKeys = {
    all: ['dhis2', 'source-routes'] as const,
    test: (code: string) => ['caps', 'source-route-test', code] as const,
}

const SOURCE_ROUTE_FIELDS =
    'id,code,name,url,disabled,authorities,responseTimeoutSeconds'

/** Staging routes whose code starts with `caps-src-`, i.e. the connected source instances. */
export function useSourceRoutesQuery() {
    const engine = useDataEngine()
    return useQuery({
        queryKey: sourceRouteKeys.all,
        queryFn: async () => {
            const result = (await engine.query({
                routes: {
                    resource: 'routes',
                    params: {
                        filter: `code:like:${SOURCE_ROUTE_CODE_PREFIX}`,
                        fields: SOURCE_ROUTE_FIELDS,
                        order: 'name:asc',
                        paging: false,
                    },
                },
            })) as { routes: { routes?: SourceRoute[] } }
            return (result.routes.routes ?? []).filter((route) =>
                route.code.startsWith(SOURCE_ROUTE_CODE_PREFIX)
            )
        },
    })
}

export function useSaveSourceRoute() {
    const engine = useDataEngine()
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (values: SourceRouteFormValues) => {
            if (values.id) {
                await engine.mutate({
                    type: 'json-patch',
                    resource: 'routes',
                    id: values.id,
                    data: buildSourceRoutePatch(values) as unknown as Record<
                        string,
                        unknown
                    >,
                })
                return
            }
            await engine.mutate({
                type: 'create',
                resource: 'routes',
                data: buildSourceRouteCreatePayload(values),
            })
        },
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: sourceRouteKeys.all }),
    })
}

export function useDeleteSourceRoute() {
    const engine = useDataEngine()
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (id: string) =>
            engine.mutate({ type: 'delete', resource: 'routes', id }),
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: sourceRouteKeys.all }),
    })
}

export function useTestSourceRoute() {
    const engine = useDataEngine()
    return useMutation({
        mutationFn: (routeCode: string) => testSourceRoute(engine, routeCode),
    })
}

export function useSourceRouteHealthQueries(routes: SourceRoute[]) {
    const engine = useDataEngine()
    return useQueries({
        queries: routes.map((route) => ({
            queryKey: sourceRouteKeys.test(route.code),
            queryFn: () => testSourceRoute(engine, route.code),
            enabled: !route.disabled,
        })),
    })
}
