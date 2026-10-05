import i18n from '@dhis2/d2-i18n'
import type { UseQueryResult } from '@tanstack/react-query'
import * as React from 'react'
import { SystemHealthCard } from './SystemHealthCard'
import { filterDetailRows, formatWhenPresent } from './systemInfoHelpers'
import type { SourceRouteTestResponse } from '@/capsApi/types'
import {
    baseUrlFromRouteUrl,
    type SourceRoute,
} from '@/modules/connected-instances/schemas/routeForm'
import { formatPastRelative } from '@/shared/utils/date.utils'

export interface SourceInstanceCardsProps {
    routes: SourceRoute[]
    results: UseQueryResult<SourceRouteTestResponse>[]
}

/** One card per connected DHIS2 source instance (`caps-src-*` route). */
export const SourceInstanceCards: React.FC<SourceInstanceCardsProps> = ({
    routes,
    results,
}) => (
    <>
        {routes.map((route, index) => {
            const result = results[index]
            const test = result?.data
            const system = test?.system
            const connected = Boolean(test?.reachable)
            const loading = !route.disabled && Boolean(result?.isLoading)
            const disconnectedMessage = route.disabled
                ? i18n.t('Route is disabled')
                : (test?.error ??
                  (result?.error instanceof Error
                      ? result.error.message
                      : undefined))

            return (
                <SystemHealthCard
                    key={route.id}
                    id={`source-${route.code}`}
                    title={route.name}
                    description={i18n.t('Source instance · {{url}}', {
                        url: baseUrlFromRouteUrl(route.url),
                        interpolation: { escapeValue: false },
                    })}
                    initial={route.name.trim().charAt(0).toUpperCase() || 'S'}
                    accent="blue"
                    connected={connected}
                    rows={filterDetailRows([
                        {
                            label: i18n.t('DHIS2 version'),
                            value: system?.version ?? undefined,
                        },
                        {
                            label: i18n.t('System name'),
                            value: system?.systemName ?? undefined,
                        },
                        {
                            label: i18n.t('Connected as'),
                            value:
                                test?.user?.username ??
                                test?.user?.displayName ??
                                undefined,
                        },
                        {
                            label: i18n.t('Analytics up to'),
                            value: formatWhenPresent(
                                system?.analyticsUpTo ?? undefined
                            ),
                        },
                        {
                            label: i18n.t('Server time'),
                            value: formatWhenPresent(
                                system?.serverDate ?? undefined
                            ),
                        },
                    ])}
                    checkedLabel={formatPastRelative(
                        result?.dataUpdatedAt ?? 0
                    )}
                    disconnectedMessage={disconnectedMessage}
                    loading={loading}
                />
            )
        })}
    </>
)
