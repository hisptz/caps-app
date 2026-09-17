import type { useDataMutation } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import { z } from 'zod'
import { CAPS_ROUTE_CODE, CAPS_ROUTE_RUN_PREFIX } from '@/capsApi/capsRoute'
import { pathToCapsId } from '@/capsApi/client'

export type Dhis2RoutePayload = {
    id: string
    code: string
    name: string
    description: string
    url: string
    headers: Record<string, string>
    disabled: boolean
}

export type RoutesListResponse = {
    routes?: Dhis2RoutePayload[]
}

/**
 * DHIS2 Route `url` must end with `/**` so request paths can be appended when
 * proxying (subpaths are forwarded after the base).
 */
export function toDhis2RouteTargetUrl(input: string): string {
    const s = input.trim().replace(/\/+$/, '')
    if (s.endsWith('/**')) {
        return s
    }
    return `${s}/**`
}

/** Remove trailing `/**` when showing a stored route URL in the form. */
export function baseUrlForEdit(storedUrl: string): string {
    return storedUrl.replace(/\/\*\*\s*$/, '')
}

export const routeListQuery = {
    routeList: {
        resource: 'routes',
        params: {
            filter: [`code:eq:${CAPS_ROUTE_CODE}`],
            fields: 'id,code,name,url,disabled,headers,description',
        },
    },
}

// Default `httpUrl` hostnames are DNS-only; widen for localhost/IP. Cast: typings omit `hostname`.
export const capsBackendUrlSchema = z.httpUrl({
    hostname: /.*/,
    message: i18n.t('Enter a valid HTTP or HTTPS URL.'),
} as unknown as Parameters<typeof z.httpUrl>[0])

export const capsBackendUrlFormSchema = z.object({
    capsBackendUrl: capsBackendUrlSchema,
})

export type CapsBackendUrlFormValues = z.infer<typeof capsBackendUrlFormSchema>

export function buildCapsRouteCreatePayload(
    capsBackendUrl: string
): Omit<Dhis2RoutePayload, 'id'> {
    const routeTargetUrl = toDhis2RouteTargetUrl(capsBackendUrl)
    return {
        code: CAPS_ROUTE_CODE,
        name: i18n.t('CAPS API'),
        description: i18n.t('Proxy target for the CAPS monitoring API'),
        url: routeTargetUrl,
        headers: {},
        disabled: false,
    }
}

type CreateRouteVars = { data: Dhis2RoutePayload }

export const createRouteMutation = {
    type: 'create' as const,
    resource: 'routes',
    data: (vars: CreateRouteVars) => vars.data,
}

type UpdateRouteVars = { id: string; data: Dhis2RoutePayload }

export const updateRouteMutation = {
    type: 'update' as const,
    resource: 'routes',
    id: (vars: UpdateRouteVars) => vars.id,
    data: (vars: UpdateRouteVars) => vars.data,
} as unknown as Parameters<typeof useDataMutation>[0]

type TriggerPipelineMutationVars = {
    pipelineId: string
    body?: { context?: Record<string, unknown> }
}

export function getTriggerPipelineMutation(pipelineId: string) {
    return {
        type: 'create' as const,
        resource: `${CAPS_ROUTE_RUN_PREFIX}/${pathToCapsId(
            `/monitoring/pipelines/${pipelineId}/trigger`
        )}`,
        data: (vars: TriggerPipelineMutationVars) =>
            (vars.body ?? {}) as Record<string, unknown>,
    } as unknown as Parameters<typeof useDataMutation>[0]
}
