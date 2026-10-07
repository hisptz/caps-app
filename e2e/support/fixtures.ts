import { test as base, expect } from '@playwright/test'

/** Fails any test in which the app throws an uncaught error. */
export const test = base.extend<{ pageErrors: Error[] }>({
    pageErrors: [
        async ({ page }, use) => {
            const errors: Error[] = []
            page.on('pageerror', (error) => errors.push(error))
            await use(errors)
            expect(errors, 'uncaught errors in the app').toEqual([])
        },
        { auto: true },
    ],
})

export { expect }
