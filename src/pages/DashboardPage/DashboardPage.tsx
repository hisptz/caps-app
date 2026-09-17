import { useDataEngine } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import { Button, CircularLoader, IconSync16, NoticeBox } from '@dhis2/ui'
import { useQueryClient } from '@tanstack/react-query'
import React from 'react'
import { DashboardStatsRow } from './components/DashboardStatsRow'
import { RecentFailuresSection } from './components/RecentFailuresSection'
import { StuckExecutionsSection } from './components/StuckExecutionsSection'
import classes from './DashboardPage.module.css'
import { CapsApiError } from '@/capsApi/client'
import { capsKeys } from '@/capsApi/queryKeys'
import { useDashboardQuery } from '@/modules/monitoring/hooks/capsMonitoringHooks'
import shellClasses from '@/shared/components/ui/PageShell/PageShell.module.css'

const DashboardPage: React.FC = () => {
    const engine = useDataEngine()
    const queryClient = useQueryClient()
    const { data, isLoading, isFetching, error, isError } =
        useDashboardQuery(engine)

    const handleRefresh = () => {
        void queryClient.invalidateQueries({ queryKey: capsKeys.dashboard() })
    }

    if (isLoading && !data) {
        return (
            <div className={shellClasses.pageRoot}>
                <CircularLoader />
            </div>
        )
    }

    if (isError) {
        const message =
            error instanceof CapsApiError
                ? error.message
                : i18n.t('An unexpected error occurred.')
        return (
            <div className={shellClasses.pageRoot}>
                <NoticeBox error title={i18n.t('Could not load dashboard')}>
                    {message}
                </NoticeBox>
            </div>
        )
    }

    const last24h = data?.last24h ?? {
        total: 0,
        completed: 0,
        failed: 0,
        running: 0,
        awaitingStep: 0,
    }
    const stuckExecutions = data?.stuckExecutions ?? []
    const recentFailures = data?.recentFailures ?? []

    return (
        <div className={shellClasses.pageRoot}>
            <div className={classes.header}>
                <h2>{i18n.t('Dashboard')}</h2>
                <div className={classes.refreshWrap}>
                    {isFetching && <CircularLoader />}
                    <Button
                        icon={<IconSync16 />}
                        disabled={isFetching}
                        onClick={handleRefresh}
                    >
                        {i18n.t('Refresh')}
                    </Button>
                </div>
            </div>

            <DashboardStatsRow last24h={last24h} />

            <StuckExecutionsSection stuckExecutions={stuckExecutions} />

            <RecentFailuresSection recentFailures={recentFailures} />
        </div>
    )
}

export default DashboardPage
