import { useDataQuery } from '@dhis2/app-runtime'
import { useMemo } from 'react'

const MODELING_APP_KEYS = ['dhis2-chapmodeling-app', 'chapmodeling', 'modeling']

type InstalledApp = {
    key?: string
    name?: string
    launchUrl?: string
}

const APPS_QUERY = {
    apps: {
        resource: 'apps',
    },
}

export function useModelingAppUrl(): string | null {
    const { data } = useDataQuery<{ apps: InstalledApp[] }>(APPS_QUERY)

    return useMemo(() => {
        const apps = Array.isArray(data?.apps) ? data.apps : []
        const match = apps.find((app) => {
            const key = app.key?.toLowerCase() ?? ''
            return MODELING_APP_KEYS.some((candidate) =>
                key.includes(candidate.toLowerCase())
            )
        })
        return match?.launchUrl ?? null
    }, [data])
}
