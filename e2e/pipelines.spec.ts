import type { Page, Response } from '@playwright/test'
import { APP_PATH } from './support/env'
import { expect, test } from './support/fixtures'

/** Waits for a CAPS call proxied through the DHIS2 route. */
function capsCall(page: Page, method: string): Promise<Response> {
    return page.waitForResponse(
        (res) =>
            res.request().method() === method &&
            res.url().includes('/routes/caps/run/pipelines')
    )
}

test('lists pipelines through the CAPS route', async ({ page }) => {
    const list = capsCall(page, 'GET')
    await page.goto(`${APP_PATH}#/pipelines`)
    expect((await list).ok()).toBe(true)
    await expect(
        page.getByRole('heading', { name: 'Pipelines', exact: true })
    ).toBeVisible()
    await expect(page.getByText('Could not load pipelines')).toHaveCount(0)
})

test('creates, edits and deletes a pipeline', async ({ page }) => {
    const name = `E2E smoke ${Date.now()}`
    const renamed = `${name} (edited)`

    await page.goto(`${APP_PATH}#/pipelines`)

    // Create
    await page.getByRole('button', { name: 'New Pipeline' }).click()
    await page.getByLabel('Name').fill(name)
    const created = capsCall(page, 'POST')
    await page.getByRole('button', { name: 'Create pipeline' }).click()
    expect((await created).ok()).toBe(true)
    const row = page.getByRole('row').filter({ hasText: name })
    await expect(row).toBeVisible()

    // Edit
    await row.getByRole('button', { name: 'Edit pipeline' }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('Name').fill(renamed)
    const updated = capsCall(page, 'PUT')
    await dialog.getByRole('button', { name: 'Save changes' }).click()
    expect((await updated).ok()).toBe(true)
    const renamedRow = page.getByRole('row').filter({ hasText: renamed })
    await expect(renamedRow).toBeVisible()

    // Delete
    await renamedRow.getByRole('button', { name: 'Delete pipeline' }).click()
    const deleted = capsCall(page, 'DELETE')
    await page
        .getByRole('dialog')
        .getByRole('button', { name: 'Delete', exact: true })
        .click()
    expect((await deleted).ok()).toBe(true)
    await expect(renamedRow).toHaveCount(0)
})
