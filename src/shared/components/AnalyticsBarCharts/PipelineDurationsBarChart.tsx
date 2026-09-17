import i18n from '@dhis2/d2-i18n'
import type { Options } from 'highcharts'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
import React, { useId, useMemo } from 'react'
import classes from './AnalyticsBarCharts.module.css'
import 'highcharts/modules/accessibility'
import {
    barChartBase,
    COLOR_RUNNING,
    COLOR_SUCCESS,
    escapeHtml,
    formatDuration,
    truncate,
} from './analyticsBarChartUtils'
import type { PipelineDuration } from '@/shared/types/caps'

type PipelineDurationsBarChartProps = {
    durations: PipelineDuration[]
}

export const PipelineDurationsBarChart: React.FC<
    PipelineDurationsBarChartProps
> = ({ durations }) => {
    const summaryId = useId()

    const { summaryText, chartOptions } = useMemo(() => {
        if (durations.length === 0) {
            return {
                summaryText: i18n.t(
                    'No pipeline duration data for this period.'
                ),
                chartOptions: null as Options | null,
            }
        }
        const summary = i18n.t(
            'Pipeline durations for {{count}} pipelines in this period.',
            { count: durations.length }
        )
        const categories = durations.map((d) => truncate(d.pipelineName, 36))
        const height = Math.min(420, 120 + durations.length * 44)
        const opts = barChartBase({
            height,
            summary,
            categories,
            series: [
                {
                    type: 'bar',
                    name: i18n.t('Avg Duration'),
                    data: durations.map((d) => d.avgDurationSeconds),
                    color: COLOR_SUCCESS,
                    tooltip: {
                        pointFormatter: function () {
                            const d = durations[this.index]
                            if (!d) {
                                return ''
                            }
                            return `<b>${escapeHtml(d.pipelineName)}</b><br/>${i18n.t('Avg Duration')}: <b>${formatDuration(d.avgDurationSeconds)}</b><br/>${i18n.t('P95 Duration')}: <b>${formatDuration(d.p95DurationSeconds)}</b><br/>${i18n.t('Run Count')}: ${d.runCount}`
                        },
                    },
                    dataLabels: {
                        formatter: function () {
                            const d = durations[this.index]
                            return d ? formatDuration(d.avgDurationSeconds) : ''
                        },
                    },
                },
                {
                    type: 'bar',
                    name: i18n.t('P95 Duration'),
                    data: durations.map((d) => d.p95DurationSeconds),
                    color: COLOR_RUNNING,
                    tooltip: {
                        pointFormatter: function () {
                            const d = durations[this.index]
                            if (!d) {
                                return ''
                            }
                            return `<b>${escapeHtml(d.pipelineName)}</b><br/>${i18n.t('Avg Duration')}: <b>${formatDuration(d.avgDurationSeconds)}</b><br/>${i18n.t('P95 Duration')}: <b>${formatDuration(d.p95DurationSeconds)}</b><br/>${i18n.t('Run Count')}: ${d.runCount}`
                        },
                    },
                    dataLabels: {
                        formatter: function () {
                            const d = durations[this.index]
                            return d ? formatDuration(d.p95DurationSeconds) : ''
                        },
                    },
                },
            ],
        })
        return { summaryText: summary, chartOptions: opts }
    }, [durations])

    if (durations.length === 0 || !chartOptions) {
        return (
            <p className={classes.empty} id={summaryId}>
                {i18n.t('No duration data.')}
            </p>
        )
    }

    return (
        <div className={classes.root} data-testid="pipeline-durations-chart">
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
                    <caption>{i18n.t('Pipeline Durations')}</caption>
                    <thead>
                        <tr>
                            <th scope="col">{i18n.t('Pipeline')}</th>
                            <th scope="col">{i18n.t('Avg Duration')}</th>
                            <th scope="col">{i18n.t('P95 Duration')}</th>
                            <th scope="col">{i18n.t('Run Count')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {durations.map((d) => (
                            <tr key={d.pipelineName}>
                                <td>{d.pipelineName}</td>
                                <td>{formatDuration(d.avgDurationSeconds)}</td>
                                <td>{formatDuration(d.p95DurationSeconds)}</td>
                                <td>{d.runCount}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
