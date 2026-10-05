import { useDataEngine } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import { Button, CircularLoader, IconSync16, NoticeBox } from '@dhis2/ui'
import * as React from 'react'
import classes from './About.module.css'
import { ConnectedSystemCards } from './ConnectedSystemCards'
import { countHealthy } from './connectedSystems.utils'
import { SourceInstanceCards } from './SourceInstanceCards'
import { CapsApiError } from '@/capsApi/client'
import {
    useSourceRouteHealthQueries,
    useSourceRoutesQuery,
} from '@/modules/connected-instances/hooks/useSourceRoutes'
import { useSystemInfoQuery } from '@/modules/monitoring/hooks/capsMonitoringHooks'
import { formatPastRelative } from '@/shared/utils/date.utils'

export const ConnectedSystemsSection: React.FC = () => {
    const engine = useDataEngine()
    const {
        data,
        isLoading,
        isFetching,
        error,
        isError,
        refetch,
        dataUpdatedAt,
    } = useSystemInfoQuery(engine)

    const sourceRoutesQuery = useSourceRoutesQuery()
    const sourceRoutes = sourceRoutesQuery.data ?? []
    const sourceResults = useSourceRouteHealthQueries(sourceRoutes)
    const sourcesFetching =
        sourceRoutesQuery.isFetching ||
        sourceResults.some((result) => result.isFetching)
    const refreshing = isFetching || sourcesFetching

    const caps = data?.caps
    const fetchLatencyMs = data?.fetchLatencyMs

    const handleRefresh = () => {
        void refetch()
        void sourceRoutesQuery
            .refetch()
            .then(() => sourceResults.forEach((result) => result.refetch()))
    }

    const checkedLabel = formatPastRelative(dataUpdatedAt)
    const refreshedLabel = formatPastRelative(dataUpdatedAt)

    const coreHealth =
        caps != null ? countHealthy(caps) : { healthy: 0, total: 4 }
    const health = {
        healthy:
            coreHealth.healthy +
            sourceResults.filter((result) => result.data?.reachable).length,
        total: coreHealth.total + sourceRoutes.length,
    }

    const allHealthy = caps != null && health.healthy === health.total

    return (
        <section
            className={classes.connectedSystemsSection}
            aria-labelledby="connected-systems-title"
        >
            <div className={classes.connectedSystemsHeader}>
                <div className={classes.connectedSystemsHeaderText}>
                    <h3
                        id="connected-systems-title"
                        className={classes.connectedSystemsTitle}
                    >
                        {i18n.t('Connected systems')}
                    </h3>
                    <p className={classes.connectedSystemsSubtitle}>
                        {i18n.t(
                            'Services CAPS depends on. Health probes run every 5 minutes; versions and revisions are reported by each system at handshake.'
                        )}
                    </p>
                </div>
                <div className={classes.connectedSystemsToolbar}>
                    {caps != null && (
                        <div className={classes.toolbarStatus}>
                            <span
                                className={
                                    allHealthy
                                        ? classes.healthSummaryOk
                                        : classes.healthSummaryWarn
                                }
                            >
                                {i18n.t('{{healthy}} of {{total}} healthy', {
                                    healthy: health.healthy,
                                    total: health.total,
                                })}
                            </span>
                            <span className={classes.refreshedAt}>
                                {i18n.t('refreshed {{when}}', {
                                    when: refreshedLabel,
                                })}
                            </span>
                        </div>
                    )}
                    <div className={classes.refreshWrap}>
                        {refreshing && <CircularLoader />}
                        <Button
                            icon={<IconSync16 />}
                            disabled={refreshing}
                            aria-busy={refreshing}
                            onClick={handleRefresh}
                        >
                            {i18n.t('Refresh')}
                        </Button>
                    </div>
                </div>
            </div>

            {isLoading && (
                <div className={classes.systemLoader}>
                    <CircularLoader />
                </div>
            )}
            {isError && (
                <NoticeBox
                    error
                    title={i18n.t('Could not load system information')}
                >
                    {error instanceof CapsApiError
                        ? error.message
                        : i18n.t('An unexpected error occurred.')}
                </NoticeBox>
            )}
            {!isLoading && !isError && caps && (
                <div className={classes.systemGrid}>
                    <ConnectedSystemCards
                        caps={caps}
                        checkedLabel={checkedLabel}
                        latencyMs={fetchLatencyMs}
                    />
                    <SourceInstanceCards
                        routes={sourceRoutes}
                        results={sourceResults}
                    />
                </div>
            )}
        </section>
    )
}
