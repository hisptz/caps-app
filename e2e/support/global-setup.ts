import fs from 'node:fs'
import path from 'node:path'
import { request, type APIRequestContext } from '@playwright/test'
import { DHIS2_PASSWORD, DHIS2_URL, DHIS2_USERNAME, STORAGE_STATE } from './env'

const BUNDLE_DIR = path.join(__dirname, '..', '..', 'build', 'bundle')
const READY_TIMEOUT_MS = 10 * 60_000

async function waitForDhis2(api: APIRequestContext) {
    const deadline = Date.now() + READY_TIMEOUT_MS
    while (Date.now() < deadline) {
        const res = await api.get('/api/system/info').catch(() => undefined)
        if (res?.ok()) {
            return
        }
        await new Promise((resolve) => setTimeout(resolve, 5_000))
    }
    throw new Error(
        `DHIS2 at ${DHIS2_URL} is not up. Start the stack: pnpm e2e:up`
    )
}

function findBundle(): string {
    const zip = fs.existsSync(BUNDLE_DIR)
        ? fs.readdirSync(BUNDLE_DIR).find((file) => file.endsWith('.zip'))
        : undefined
    if (!zip) {
        throw new Error('No app bundle in build/bundle. Run pnpm build first.')
    }
    return path.join(BUNDLE_DIR, zip)
}

async function installApp(api: APIRequestContext) {
    const bundle = findBundle()
    const res = await api.post('/api/apps', {
        multipart: {
            file: {
                name: path.basename(bundle),
                mimeType: 'application/zip',
                buffer: fs.readFileSync(bundle),
            },
        },
    })
    if (!res.ok()) {
        throw new Error(
            `App install failed: ${res.status()} ${await res.text()}`
        )
    }
}

/** Remove the CAPS route so onboarding starts from the welcome screen. */
async function resetCapsRoute(api: APIRequestContext) {
    const res = await api.get('/api/routes', {
        params: { filter: 'code:eq:caps', fields: 'id' },
    })
    const { routes = [] } = (await res.json()) as { routes?: { id: string }[] }
    for (const { id } of routes) {
        await api.delete(`/api/routes/${id}`)
    }
}

export default async function globalSetup() {
    const admin = await request.newContext({
        baseURL: DHIS2_URL,
        httpCredentials: {
            username: DHIS2_USERNAME,
            password: DHIS2_PASSWORD,
            send: 'always',
        },
    })
    await waitForDhis2(admin)
    await installApp(admin)
    await resetCapsRoute(admin)
    await admin.dispose()

    // Session cookie for the browser, via the same login endpoint the DHIS2
    // login app uses.
    const session = await request.newContext({ baseURL: DHIS2_URL })
    const login = await session.post('/api/auth/login', {
        data: { username: DHIS2_USERNAME, password: DHIS2_PASSWORD },
    })
    if (!login.ok()) {
        throw new Error(`DHIS2 login failed: ${login.status()}`)
    }
    await session.storageState({ path: STORAGE_STATE })
    await session.dispose()
}
