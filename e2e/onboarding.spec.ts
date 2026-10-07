import { APP_PATH, CAPS_BACKEND_URL } from './support/env'
import { expect, test } from './support/fixtures'

test('connects the app to the CAPS backend through a DHIS2 route', async ({
    page,
}) => {
    await page.goto(APP_PATH)
    await expect(
        page.getByRole('heading', { name: 'Welcome to CAPS' })
    ).toBeVisible()

    await page.getByLabel('CAPS backend base URL').fill(CAPS_BACKEND_URL)
    const routeCreated = page.waitForResponse(
        (res) =>
            res.request().method() === 'POST' &&
            /\/api\/\d*\/?routes$/.test(new URL(res.url()).pathname)
    )
    await page.getByRole('button', { name: 'Save and continue' }).click()
    expect((await routeCreated).ok()).toBe(true)

    // The dashboard only renders once the app can reach CAPS via the route.
    await expect(
        page.getByRole('navigation', { name: 'Main navigation' })
    ).toBeVisible()
})
