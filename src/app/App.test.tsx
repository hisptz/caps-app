import { CustomDataProvider, Provider } from '@dhis2/app-runtime'
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

const testConfig = {
    baseUrl: 'http://localhost:8080',
    apiVersion: 41,
}

/** Minimal CustomData so CapsSetupGate and the dashboard route can resolve. */
const customData = {
    routes: {
        routes: [
            {
                id: 'route-1',
                code: 'caps',
                name: 'CAPS API',
                url: 'http://localhost:4000/**',
                headers: {},
                disabled: false,
            },
        ],
    },
    'routes/caps/run': async (_type: string, query: { id?: string }) => {
        const id = query.id ?? ''
        if (id === 'monitoring/dashboard') {
            return {
                last24h: {
                    total: 0,
                    completed: 0,
                    failed: 0,
                    running: 0,
                    awaitingStep: 0,
                },
                stuckExecutions: [],
                recentFailures: [],
            }
        }
        return {}
    },
    // CustomData from app-runtime — typed internally; keep test setup loose.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any

it('renders without crashing', () => {
    const container = document.createElement('div')

    const root = createRoot(container)
    root.render(
        <Provider
            config={testConfig}
            userInfo={undefined}
            plugin={false}
            parentAlertsAdd={() => undefined}
            showAlertsInPlugin={false}
        >
            <CustomDataProvider
                data={customData}
                options={{ failOnMiss: false }}
            >
                <App />
            </CustomDataProvider>
        </Provider>
    )

    root.unmount()
})
