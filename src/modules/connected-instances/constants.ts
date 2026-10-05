export const SOURCE_ROUTE_CODE_PREFIX = 'caps-src-'
export const SOURCE_ROUTE_CODE_PATTERN = /^caps-src-[A-Za-z0-9_-]+$/
export const CAPS_IMPORTED_GROUP_CODE = 'CAPS_IMPORTED'

/** DHIS2 route run path for a source route, relative to the API root. */
export function sourceRunResource(routeCode: string, path: string): string {
    return `routes/${routeCode}/run/${path.replace(/^\/+/, '')}`
}
