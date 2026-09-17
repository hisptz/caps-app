/** Fixed DHIS2 Route code for the CAPS backend proxy (see Settings). */
export const CAPS_ROUTE_CODE = 'caps'

/**
 * Path segment after the DHIS2 API root for proxied CAPS calls, no leading/trailing slashes.
 * Full CAPS URL: `${apiRoot}/routes/caps/run${capsPath}` e.g. `/pipelines` → …/routes/caps/run/pipelines
 */
export const CAPS_ROUTE_RUN_PREFIX = `routes/${CAPS_ROUTE_CODE}/run`
