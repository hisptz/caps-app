import i18n from '@dhis2/d2-i18n'
import { CircularLoader } from '@dhis2/ui'
import React from 'react'
import classes from '../AnalyticsPage.module.css'
import {
    ExecutionTrendChart,
    type TrendChartPoint,
} from '@/shared/components/ExecutionTrendChart'

type TrendRow = [string, { completed: number; failed: number }]

type Props = {
    isLoading: boolean
    hasLoadedOnce: boolean
    chartPoints: TrendChartPoint[]
    sortedTrendRows: TrendRow[]
}

export function ExecutionTrendsSection({
    isLoading,
    hasLoadedOnce,
    chartPoints,
    sortedTrendRows,
}: Props): React.ReactElement {
    return (
        <section className={classes.section}>
            <h3>{i18n.t('Execution Trends')}</h3>
            {isLoading && !hasLoadedOnce ? (
                <CircularLoader />
            ) : (
                <>
                    <ExecutionTrendChart points={chartPoints} />
                    <div className={classes.srOnly}>
                        <table>
                            <caption>
                                {i18n.t('Execution trends summary table')}
                            </caption>
                            <thead>
                                <tr>
                                    <th scope="col">{i18n.t('Date')}</th>
                                    <th scope="col">{i18n.t('Completed')}</th>
                                    <th scope="col">{i18n.t('Failed')}</th>
                                    <th scope="col">
                                        {i18n.t('Success Rate')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedTrendRows.map(([date, counts]) => {
                                    const total =
                                        counts.completed + counts.failed
                                    const rate =
                                        total > 0
                                            ? Math.round(
                                                  (counts.completed / total) *
                                                      100
                                              )
                                            : 0
                                    return (
                                        <tr key={date}>
                                            <td>{date}</td>
                                            <td>{counts.completed}</td>
                                            <td>{counts.failed}</td>
                                            <td>
                                                {i18n.t(
                                                    '{{rate}} percent success rate',
                                                    { rate: String(rate) }
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </section>
    )
}
