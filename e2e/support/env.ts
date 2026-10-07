import path from 'node:path'

export const DHIS2_URL = process.env.E2E_DHIS2_URL ?? 'http://127.0.0.1:18080'
export const DHIS2_USERNAME = process.env.E2E_DHIS2_USERNAME ?? 'admin'
export const DHIS2_PASSWORD = process.env.E2E_DHIS2_PASSWORD ?? 'district'

/** CAPS API as DHIS2 sees it from inside the stack's network. */
export const CAPS_BACKEND_URL =
    process.env.E2E_CAPS_BACKEND_URL ?? 'http://api:4000'

/** Installed app key comes from the package name. */
export const APP_PATH = '/api/apps/caps-app/index.html'

export const STORAGE_STATE = path.join(__dirname, '..', '.auth', 'admin.json')
