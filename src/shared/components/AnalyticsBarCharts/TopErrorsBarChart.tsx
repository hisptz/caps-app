import i18n from '@dhis2/d2-i18n'
import type { Options } from 'highcharts'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
import React, { useId, useMemo } from 'react'
import classes from './AnalyticsBarCharts.module.css'
import 'highcharts/modules/accessibility'
import {
    barChartBase,
    COLOR_WARNING,
    escapeHtml,
    truncate,
} from './analyticsBarChartUtils'
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
                chartOptions: null as Options | null,
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
            height,
            summary,
            categories,
            series: [
                {
                    type: 'bar',
                    name: i18n.t('Occurrences'),
                    data: errors.map((e) => e.occurrenceCount),
                    color: COLOR_WARNING,
                    tooltip: {
                        headerFormat: '',
                        pointFormatter: function () {
                            const err = errors[this.index]
                            if (!err) {
                                return ''
                            }
                            return `<span style="white-space:pre-wrap">${escapeHtml(err.errorMessage)}</span><br/><br/><b>${i18n.t('Occurrences')}: ${err.occurrenceCount}</b>`
                        },
                    },
                    dataLabels: {
                        format: '{y}',
                    },
                },
            ],
        })
        return { summaryText: summary, chartOptions: opts }
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
                <HighchartsReact
                    highcharts={Highcharts}
                    options={chartOptions}
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
