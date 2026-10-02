import i18n from '@dhis2/d2-i18n'
import { z } from 'zod'
import { SOURCE_ROUTE_CODE_PREFIX } from '@/modules/connected-instances/constants'

export const SOURCE_ROUTE_AUTH_TYPES = [
    'api-token',
    'http-basic',
    'api-headers',
] as const

export type SourceRouteAuthType = (typeof SOURCE_ROUTE_AUTH_TYPES)[number]

export const DEFAULT_ROUTE_TIMEOUT_SECONDS = 60
export const MAX_ROUTE_TIMEOUT_SECONDS = 60
const MAX_CODE_LENGTH = 50

/** A DHIS2 route as `GET /api/routes` returns it. Credentials are never returned. */
export type SourceRoute = {
    id: string
    code: string
    name: string
    url: string
    disabled?: boolean
    authorities?: string[]
    responseTimeoutSeconds?: number
}

export const sourceRouteFormSchema = z
    .object({
        id: z.string().optional(),
        name: z
            .string()
            .trim()
            .min(1, { message: i18n.t('Name is required') }),
        key: z
            .string()
            .trim()
            .regex(/^[a-z0-9][a-z0-9-]*$/, {
                message: i18n.t(
                    'Use lowercase letters, digits and dashes, e.g. play'
                ),
            })
            .max(MAX_CODE_LENGTH - SOURCE_ROUTE_CODE_PREFIX.length),
        baseUrl: z.httpUrl({
            hostname: /.*/,
            message: i18n.t(
                'Enter the instance URL, e.g. https://play.im.dhis2.org/dev'
            ),
        } as unknown as Parameters<typeof z.httpUrl>[0]),
        responseTimeoutSeconds: z
            .number()
            .int()
            .min(1)
            .max(MAX_ROUTE_TIMEOUT_SECONDS),
        authorities: z.string(),
        changeCredentials: z.boolean(),
        authType: z.enum(SOURCE_ROUTE_AUTH_TYPES),
        token: z.string().optional(),
        username: z.string().optional(),
        password: z.string().optional(),
        headers: z.array(z.object({ name: z.string(), value: z.string() })),
    })
    .superRefine((values, ctx) => {
        if (!values.changeCredentials) {
            return
        }
        const require = (
            field: 'token' | 'username' | 'password',
            message: string
        ) => {
            if (!values[field]?.trim()) {
                ctx.addIssue({ code: 'custom', path: [field], message })
            }
        }
        switch (values.authType) {
            case 'api-token':
                require('token', i18n.t('Enter the personal access token'))
                break
            case 'http-basic':
                require('username', i18n.t('Enter the username'))
                require('password', i18n.t('Enter the password'))
                break
            case 'api-headers': {
                const filled = values.headers.filter(
                    (h) => h.name.trim() && h.value.trim()
                )
                if (filled.length === 0) {
                    ctx.addIssue({
                        code: 'custom',
                        path: ['headers'],
                        message: i18n.t(
                            'Add at least one header name and value'
                        ),
                    })
                }
                break
            }
        }
    })

export type SourceRouteFormValues = z.infer<typeof sourceRouteFormSchema>

export function defaultSourceRouteFormValues(): SourceRouteFormValues {
    return {
        name: '',
        key: '',
        baseUrl: '',
        responseTimeoutSeconds: DEFAULT_ROUTE_TIMEOUT_SECONDS,
        authorities: '',
        changeCredentials: true,
        authType: 'api-token',
        token: '',
        username: '',
        password: '',
        headers: [{ name: '', value: '' }],
    }
}

/** `https://play.im.dhis2.org/dev/api/**` → `https://play.im.dhis2.org/dev` */
export function baseUrlFromRouteUrl(url: string): string {
    return url
        .trim()
        .replace(/\/\*\*$/, '')
        .replace(/\/+$/, '')
        .replace(/\/api$/, '')
}

export function routeUrlFromBaseUrl(baseUrl: string): string {
    return `${baseUrlFromRouteUrl(baseUrl)}/api/**`
}

export function sourceRouteToFormValues(
    route: SourceRoute
): SourceRouteFormValues {
    return {
        ...defaultSourceRouteFormValues(),
        id: route.id,
        name: route.name,
        key: route.code.startsWith(SOURCE_ROUTE_CODE_PREFIX)
            ? route.code.slice(SOURCE_ROUTE_CODE_PREFIX.length)
            : route.code,
        baseUrl: baseUrlFromRouteUrl(route.url),
        responseTimeoutSeconds:
            route.responseTimeoutSeconds ?? DEFAULT_ROUTE_TIMEOUT_SECONDS,
        authorities: (route.authorities ?? []).join(', '),
        changeCredentials: false,
    }
}

export function parseAuthorities(text: string): string[] {
    return [
        ...new Set(
            text
                .split(',')
                .map((a) => a.trim())
                .filter(Boolean)
        ),
    ]
}

export type SourceRouteAuth =
    | { type: 'api-token'; token: string }
    | { type: 'http-basic'; username: string; password: string }
    | { type: 'api-headers'; headers: Record<string, string> }

export function buildSourceRouteAuth(
    values: SourceRouteFormValues
): SourceRouteAuth {
    switch (values.authType) {
        case 'api-token':
            return { type: 'api-token', token: values.token?.trim() ?? '' }
        case 'http-basic':
            return {
                type: 'http-basic',
                username: values.username?.trim() ?? '',
                password: values.password ?? '',
            }
        case 'api-headers':
            return {
                type: 'api-headers',
                headers: Object.fromEntries(
                    values.headers
                        .filter((h) => h.name.trim() && h.value.trim())
                        .map((h) => [h.name.trim(), h.value.trim()])
                ),
            }
    }
}

/** Body for `POST /api/routes`. */
export function buildSourceRouteCreatePayload(values: SourceRouteFormValues) {
    return {
        code: `${SOURCE_ROUTE_CODE_PREFIX}${values.key}`,
        name: values.name.trim(),
        url: routeUrlFromBaseUrl(values.baseUrl),
        responseTimeoutSeconds: values.responseTimeoutSeconds,
        authorities: parseAuthorities(values.authorities),
        disabled: false,
        auth: buildSourceRouteAuth(values),
    }
}

/**
 * JSON Patch for `PATCH /api/routes/{id}`. DHIS2 never returns route credentials, so a full
 * update would have to resend them; patching leaves `auth` alone unless it's being changed.
 */
export function buildSourceRoutePatch(values: SourceRouteFormValues) {
    const ops: Array<{ op: 'replace' | 'add'; path: string; value: unknown }> =
        [
            { op: 'replace', path: '/name', value: values.name.trim() },
            {
                op: 'replace',
                path: '/url',
                value: routeUrlFromBaseUrl(values.baseUrl),
            },
            {
                op: 'add',
                path: '/responseTimeoutSeconds',
                value: values.responseTimeoutSeconds,
            },
            {
                op: 'add',
                path: '/authorities',
                value: parseAuthorities(values.authorities),
            },
        ]
    if (values.changeCredentials) {
        ops.push({
            op: 'add',
            path: '/auth',
            value: buildSourceRouteAuth(values),
        })
    }
    return ops
}
