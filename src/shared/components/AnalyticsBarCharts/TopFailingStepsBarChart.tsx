import i18n from '@dhis2/d2-i18n'
import type { Options } from 'highcharts'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
import React, { useId, useMemo } from 'react'
import classes from './AnalyticsBarCharts.module.css'
import 'highcharts/modules/accessibility'
import {
    barChartBase,
    COLOR_ERROR,
    escapeHtml,
    truncate,
} from './analyticsBarChartUtils'
import type { TopFailingStep } from '@/shared/types/caps'

type TopFailingStepsBarChartProps = {
    steps: TopFailingStep[]
}

export const TopFailingStepsBarChart: React.FC<
    TopFailingStepsBarChartProps
> = ({ steps }) => {
    const summaryId = useId()

    const { summaryText, chartOptions } = useMemo(() => {
        if (steps.length === 0) {
            return {
                summaryText: i18n.t('No failing step data for this period.'),
                chartOptions: null as Options | null,
            }
        }
        const total = steps.reduce((a, s) => a + s.failureCount, 0)
        const summary = i18n.t(
            'Top failing steps: {{count}} steps, {{failures}} total failures in this period.',
            {
                count: steps.length,
                failures: total,
            }
        )
        const categories = steps.map((s) =>
            truncate(`${s.stepName} — ${s.pipelineName}`, 48)
        )
        const height = Math.min(420, 100 + steps.length * 36)
        const opts = barChartBase({
            height,
            summary,
            categories,
            series: [
                {
                    type: 'bar',
                    name: i18n.t('Failure Count'),
                    data: steps.map((s) => s.failureCount),
                    color: COLOR_ERROR,
                    tooltip: {
                        headerFormat: '',
                        pointFormatter: function () {
                            const step = steps[this.index]
                            if (!step) {
                                return ''
                            }
                            return `<b>${escapeHtml(step.stepName)}</b><br/>${escapeHtml(step.pipelineName)}<br/><span style="color:#718096">${i18n.t('Failure Count')}</span>: <b>${step.failureCount}</b>`
                        },
                    },
                    dataLabels: {
                        format: '{y}',
                    },
                },
            ],
        })
        return { summaryText: summary, chartOptions: opts }
    }, [steps])

    if (steps.length === 0 || !chartOptions) {
        return (
            <p className={classes.empty} id={summaryId}>
                {i18n.t('No failing step data.')}
            </p>
        )
    }

    return (
        <div className={classes.root} data-testid="top-failing-steps-chart">
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
                    <caption>{i18n.t('Top failing steps')}</caption>
                    <thead>
                        <tr>
                            <th scope="col">{i18n.t('Step Name')}</th>
                            <th scope="col">{i18n.t('Pipeline')}</th>
                            <th scope="col">{i18n.t('Failure Count')}</th>
                            <th scope="col">{i18n.t('Avg Attempts')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {steps.map((step) => (
                            <tr key={`${step.pipelineName}:${step.stepName}`}>
                                <td>{step.stepName}</td>
                                <td>{step.pipelineName}</td>
                                <td>{step.failureCount}</td>
                                <td>{step.avgAttempts.toFixed(1)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
