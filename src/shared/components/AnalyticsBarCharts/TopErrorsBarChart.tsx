import i18n from '@dhis2/d2-i18n'
import React, { useId, useMemo } from 'react'
import classes from './AnalyticsBarCharts.module.css'
import {
    barChartBase,
    COLOR_WARNING,
    escapeHtml,
    truncate,
} from './analyticsBarChartUtils'
import { EChart, type EChartOption } from '@/shared/components/EChart'
import type { TopError } from '@/shared/types/caps'

type TopErrorsBarChartProps = {
    errors: TopError[]
}

export const TopErrorsBarChart: React.FC<TopErrorsBarChartProps> = ({
    errors,
}) => {
    const summaryId = useId()

    const { summaryText, chartOptions } = useMemo(() => {
        if (errors.length === 0) {
            return {
                summaryText: i18n.t('No error data for this period.'),
                chartOptions: null as {
                    option: EChartOption
                    height: number
                } | null,
            }
        }
        const total = errors.reduce((a, e) => a + e.occurrenceCount, 0)
        const summary = i18n.t(
            'Top errors: {{kinds}} distinct messages, {{occurrences}} total occurrences.',
            {
                kinds: errors.length,
                occurrences: total,
            }
        )
        const categories = errors.map((e) => truncate(e.errorMessage, 44))
        const height = Math.min(420, 100 + errors.length * 38)
        const opts = barChartBase({
            categories,
            tooltipFormatter: (index) => {
                const err = errors[index]
                if (!err) {
                    return ''
                }
                return `<div style="max-width:360px;white-space:pre-wrap">${escapeHtml(err.errorMessage)}</div><br/><b>${i18n.t('Occurrences')}: ${err.occurrenceCount}</b>`
            },
            series: [
                {
                    type: 'bar',
                    name: i18n.t('Occurrences'),
                    data: errors.map((e) => e.occurrenceCount),
                    itemStyle: { color: COLOR_WARNING },
                },
            ],
        })
        return {
            summaryText: summary,
            chartOptions: { option: opts, height },
        }
    }, [errors])

    if (errors.length === 0 || !chartOptions) {
        return (
            <p className={classes.empty} id={summaryId}>
                {i18n.t('No error data.')}
            </p>
        )
    }

    return (
        <div className={classes.root} data-testid="top-errors-chart">
            <p id={summaryId} className={classes.srOnly}>
                {summaryText}
            </p>
            <div
                className={classes.chartWrap}
                role="img"
                aria-labelledby={summaryId}
            >
                <EChart
                    option={chartOptions.option}
                    height={chartOptions.height}
                />
            </div>
            <div className={classes.srOnly}>
                <table>
                    <caption>{i18n.t('Top Errors')}</caption>
                    <thead>
                        <tr>
                            <th scope="col">{i18n.t('Error Message')}</th>
                            <th scope="col">{i18n.t('Occurrences')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {errors.map((e) => (
                            <tr key={e.errorMessage}>
                                <td>{e.errorMessage}</td>
                                <td>{e.occurrenceCount}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
