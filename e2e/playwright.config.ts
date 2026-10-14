import { defineConfig, devices } from '@playwright/test'
import { DHIS2_URL, STORAGE_STATE } from './support/env'

// Smoke tests run the built app installed in a real DHIS2 + CAPS stack
// (e2e/stack). See README → "E2E tests".
export default defineConfig({
    testDir: '.',
    globalSetup: './support/global-setup.ts',
    outputDir: '../test-results',
    fullyParallel: false,
    workers: 1,
    retries: process.env.CI ? 1 : 0,
    forbidOnly: !!process.env.CI,
    reporter: process.env.CI
        ? [
              ['list'],
              ['html', { open: 'never', outputFolder: '../playwright-report' }],
          ]
        : 'list',
    use: {
        ...devices['Desktop Chrome'],
        baseURL: DHIS2_URL,
        storageState: STORAGE_STATE,
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
    },
    projects: [
        // Connects the app to CAPS; everything else needs the route in place.
        { name: 'onboarding', testMatch: /onboarding\.spec\.ts/ },
        {
            name: 'smoke',
            testIgnore: /onboarding\.spec\.ts/,
            dependencies: ['onboarding'],
        },
    ],
})
