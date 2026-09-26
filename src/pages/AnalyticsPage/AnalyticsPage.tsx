import { useDataEngine } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import { NoticeBox, SingleSelectField, SingleSelectOption } from '@dhis2/ui'
import React, { useMemo, useState } from 'react'
import classes from './AnalyticsPage.module.css'
import { ExecutionTrendsSection } from './components/ExecutionTrendsSection'
import { CapsApiError } from '@/capsApi/client'
import { useAnalyticsQueries } from '@/modules/monitoring/hooks/capsMonitoringHooks'
import {
    PipelineDurationsBarChart,
    TopErrorsBarChart,
    TopFailingStepsBarChart,
} from '@/shared/components/AnalyticsBarCharts'
import type { TrendChartPoint } from '@/shared/components/ExecutionTrendChart'
import { PageLoader } from '@/shared/components/ui/PageLoader'
import shellClasses from '@/shared/components/ui/PageShell/PageShell.module.css'

const AnalyticsPage: React.FC = () => {
    const engine = useDataEngine()
    const [rangeDays, setRangeDays] = useState('7')
    const days = Math.max(1, Math.min(90, parseInt(rangeDays, 10) || 7))

    const { trendsQuery, topStepsQuery, durationsQuery, topErrorsQuery } =
        useAnalyticsQueries(engine, days)

    const trendByDate = useMemo(() => {
        const trends = trendsQuery.data ?? []
        return trends.reduce<
            Record<string, { completed: number; failed: number }>
        >((acc, t) => {
            if (!acc[t.date]) {
                acc[t.date] = { completed: 0, failed: 0 }
            }
            if (t.status === 'COMPLETED') {
                acc[t.date].completed += t.count
            }
            if (t.status === 'FAILED') {
                acc[t.date].failed += t.count
            }
            return acc
        }, {})
    }, [trendsQuery.data])

    const sortedTrendRows = useMemo(() => {
        const n = Math.min(
            Object.keys(trendByDate).length,
            Math.max(1, parseInt(rangeDays, 10) || 7)
        )
        return Object.entries(trendByDate)
            .sort(([a], [b]) => a.localeCompare(b))
            .slice(-n)
    }, [trendByDate, rangeDays])

    const chartPoints: TrendChartPoint[] = useMemo(
        () =>
            sortedTrendRows.map(([date, counts]) => ({
                date,
                completed: counts.completed,
                failed: counts.failed,
            })),
        [sortedTrendRows]
    )

    const topFailingSteps = topStepsQuery.data ?? []
    const durations = durationsQuery.data ?? []
    const topErrors = topErrorsQuery.data ?? []

    const analyticsError =
        [trendsQuery, topStepsQuery, durationsQuery, topErrorsQuery].find(
            (q) => q.isError && q.error instanceof CapsApiError
        )?.error ?? null

    return (
        <div className={shellClasses.pageRoot}>
            <div className={classes.header}>
                <h2>{i18n.t('Analytics')}</h2>
                <SingleSelectField
                    label={i18n.t('Time range')}
                    selected={rangeDays}
                    onChange={({ selected }: { selected: string }) =>
                        setRangeDays(selected)
                    }
                    className={classes.rangeSelect}
                >
                    <SingleSelectOption
                        value="7"
                        label={i18n.t('Last 7 days')}
                    />
                    <SingleSelectOption
                        value="14"
                        label={i18n.t('Last 14 days')}
                    />
                    <SingleSelectOption
                        value="30"
                        label={i18n.t('Last 30 days')}
                    />
                    <SingleSelectOption
                        value="90"
                        label={i18n.t('Last 90 days')}
                    />
                </SingleSelectField>
            </div>

            {analyticsError instanceof CapsApiError && (
                <NoticeBox error title={i18n.t('Could not load analytics')}>
                    {analyticsError.message}
                </NoticeBox>
            )}

            <ExecutionTrendsSection
                isLoading={trendsQuery.isLoading}
                hasLoadedOnce={Boolean(trendsQuery.data)}
                chartPoints={chartPoints}
                sortedTrendRows={sortedTrendRows}
            />

            <section className={classes.section}>
                <h3>{i18n.t('Top Failing Steps')}</h3>
                {topStepsQuery.isLoading && !topStepsQuery.data ? (
                    <PageLoader variant="section" />
                ) : (
                    <TopFailingStepsBarChart steps={topFailingSteps} />
                )}
            </section>

            <section className={classes.section}>
                <h3>{i18n.t('Pipeline Durations')}</h3>
                {durationsQuery.isLoading && !durationsQuery.data ? (
                    <PageLoader variant="section" />
                ) : (
                    <PipelineDurationsBarChart durations={durations} />
                )}
            </section>

            <section className={classes.section}>
                <h3>{i18n.t('Top Errors')}</h3>
                {topErrorsQuery.isLoading && !topErrorsQuery.data ? (
                    <PageLoader variant="section" />
                ) : (
                    <TopErrorsBarChart errors={topErrors} />
                )}
            </section>
        </div>
    )
}

export default AnalyticsPage
