import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
    testDir: 'e2e',
    fullyParallel: true,
    retries: 0,
    workers: 1,
    reporter: 'list',
    use: {
        baseURL: 'http://127.0.0.1:3000',
        trace: 'on-first-retry',
        ...devices['iPhone 12'],
    },
    webServer: {
        command: 'pnpm start',
        url: 'http://127.0.0.1:3000',
        reuseExistingServer: true,
        timeout: 120_000,
    },
})
