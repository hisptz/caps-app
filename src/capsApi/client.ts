import { FetchError, useDataEngine } from '@dhis2/app-runtime'
import { CAPS_ROUTE_RUN_PREFIX } from '@/capsApi/capsRoute'

export class CapsApiError extends Error {
    readonly status: number
    readonly body: unknown

    constructor(message: string, status: number, body: unknown) {
        super(message)
        this.name = 'CapsApiError'
        this.status = status
        this.body = body
    }
}

/** DHIS2 DataEngine from `useDataEngine()` — used for CAPS proxy calls. */
export type CapsDataEngine = ReturnType<typeof useDataEngine>

export type CapsSearchParams = Record<
    string,
    string | number | boolean | undefined | null
>

const CAPS_QUERY_KEY = 'caps' as const

export function pathToCapsId(path: string): string {
    return path.replace(/^\/+/, '')
}

function errorMessageFromBody(body: unknown, status: number): string {
    if (typeof body === 'object' && body !== null) {
        for (const key of ['error', 'message'] as const) {
            const value = (body as Record<string, unknown>)[key]
            if (typeof value === 'string' && value.trim() !== '') {
                return value
            }
        }
    }
    if (typeof body === 'string' && body.trim() !== '') {
        return body
    }
    return `HTTP ${status}`
}

function parseBodyFromFetchError(error: FetchError): unknown {
    const msg = error.message?.trim()
    if (msg?.startsWith('{') || msg?.startsWith('[')) {
        try {
            return JSON.parse(msg) as unknown
        } catch {
            return msg
        }
    }
    return msg ?? null
}

function bodyFromFetchError(error: FetchError): unknown {
    const details = error.details as unknown
    if (
        typeof details === 'object' &&
        details !== null &&
        Object.keys(details as object).length > 0
    ) {
        return details
    }
    return parseBodyFromFetchError(error)
}

function statusFromFetchError(error: FetchError, body: unknown): number {
    const candidates: unknown[] = []
    if (typeof body === 'object' && body !== null) {
        const record = body as Record<string, unknown>
        candidates.push(
            record.httpStatusCode,
            record.statusCode,
            record.status,
            record.httpStatus
        )
    }
    // `type: 'unknown'` errors format the status into the message, e.g. "… (404)".
    candidates.push(error.message?.match(/\((\d{3})\)\s*$/)?.[1])
    for (const candidate of candidates) {
        const parsed =
            typeof candidate === 'number'
                ? candidate
                : Number.parseInt(String(candidate ?? ''), 10)
        if (Number.isFinite(parsed) && parsed >= 100 && parsed < 600) {
            return parsed
        }
    }
    return 500
}

function mapFetchErrorToCapsApi(error: unknown): never {
    if (error instanceof FetchError) {
        const body = bodyFromFetchError(error)
        const status = statusFromFetchError(error, body)
        const message = errorMessageFromBody(body, status)
        throw new CapsApiError(
            message.startsWith('HTTP ') && error.message
                ? error.message
                : message,
            status,
            body
        )
    }
    throw error
}

export function searchParamsToEngineParams(
    params?: CapsSearchParams
): Record<string, string | number | boolean> | undefined {
    if (!params) {
        return undefined
    }
    const out: Record<string, string | number | boolean> = {}
    for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null || value === '') {
            continue
        }
        out[key] = value
    }
    return Object.keys(out).length > 0 ? out : undefined
}

/** GET JSON via CAPS DHIS2 route proxy (`routes/caps/run` + path as `id`). */
export async function capsQueryJson<T>(
    engine: CapsDataEngine,
    path: string,
    options?: { searchParams?: CapsSearchParams }
): Promise<T> {
    const id = pathToCapsId(path)
    const params = searchParamsToEngineParams(options?.searchParams)
    try {
        const result = await engine.query({
            [CAPS_QUERY_KEY]: {
                resource: CAPS_ROUTE_RUN_PREFIX,
                id,
                params,
            },
        })
        return result[CAPS_QUERY_KEY] as T
    } catch (e) {
        mapFetchErrorToCapsApi(e)
    }
}

export async function capsPostJson<T>(
    engine: CapsDataEngine,
    path: string,
    options: {
        body?: unknown
        searchParams?: CapsSearchParams
    } = {}
): Promise<T> {
    const id = pathToCapsId(path)
    const resource = `${CAPS_ROUTE_RUN_PREFIX}/${id}`
    const params = searchParamsToEngineParams(options.searchParams)
    try {
        return (await engine.mutate({
            type: 'create',
            resource,
            ...(params ? { params } : {}),
            data: (options.body ?? {}) as Record<string, unknown>,
        })) as T
    } catch (e) {
        mapFetchErrorToCapsApi(e)
    }
}

export async function capsPutJson<T>(
    engine: CapsDataEngine,
    path: string,
    options: {
        body?: unknown
        searchParams?: CapsSearchParams
    } = {}
): Promise<T> {
    const id = pathToCapsId(path)
    const params = searchParamsToEngineParams(options.searchParams)
    try {
        return (await engine.mutate({
            type: 'update',
            resource: CAPS_ROUTE_RUN_PREFIX,
            id,
            ...(params ? { params } : {}),
            data: (options.body ?? {}) as Record<string, unknown>,
        })) as T
    } catch (e) {
        mapFetchErrorToCapsApi(e)
    }
}

export async function capsDeleteJson<T>(
    engine: CapsDataEngine,
    path: string,
    options: {
        searchParams?: CapsSearchParams
    } = {}
): Promise<T> {
    const id = pathToCapsId(path)
    const params = searchParamsToEngineParams(options.searchParams)
    try {
        return (await engine.mutate({
            type: 'delete',
            resource: CAPS_ROUTE_RUN_PREFIX,
            id,
            ...(params ? { params } : {}),
        })) as T
    } catch (e) {
        mapFetchErrorToCapsApi(e)
    }
}

export { capsQueryJson as capsFetchJson }
