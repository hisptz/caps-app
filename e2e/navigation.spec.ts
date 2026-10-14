import { APP_PATH } from './support/env'
import { expect, test } from './support/fixtures'

const sections = [
    { label: 'Pipelines', hash: '#/pipelines' },
    { label: 'Executions', hash: '#/executions' },
    { label: 'Climate data', hash: '#/climate-data' },
    { label: 'Settings', hash: '#/settings' },
    { label: 'About', hash: '#/about' },
    { label: 'Dashboard', hash: '#/' },
]

test('opens every section from the main menu', async ({ page }) => {
    await page.goto(APP_PATH)
    const nav = page.getByRole('navigation', { name: 'Main navigation' })

    for (const { label, hash } of sections) {
        await nav.getByText(label, { exact: true }).click()
        await expect(page).toHaveURL(new RegExp(`${hash}$`))
        await expect(page.locator('main')).not.toBeEmpty()
    }
})
