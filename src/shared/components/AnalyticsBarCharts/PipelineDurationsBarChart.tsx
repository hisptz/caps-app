import i18n from '@dhis2/d2-i18n'
import React, { useId, useMemo } from 'react'
import classes from './AnalyticsBarCharts.module.css'
import {
    barChartBase,
    COLOR_RUNNING,
    COLOR_SUCCESS,
    escapeHtml,
    formatDuration,
    truncate,
} from './analyticsBarChartUtils'
import { EChart, type EChartOption } from '@/shared/components/EChart'
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
                chartOptions: null as {
                    option: EChartOption
                    height: number
                } | null,
            }
        }
        const summary = i18n.t(
            'Pipeline durations for {{count}} pipelines in this period.',
            { count: durations.length }
        )
        const categories = durations.map((d) => truncate(d.pipelineName, 36))
        const height = Math.min(420, 120 + durations.length * 44)
        const opts = barChartBase({
            categories,
            tooltipFormatter: (index) => {
                const d = durations[index]
                if (!d) {
                    return ''
                }
                return `<b>${escapeHtml(d.pipelineName)}</b><br/>${i18n.t('Avg Duration')}: <b>${formatDuration(d.avgDurationSeconds)}</b><br/>${i18n.t('P95 Duration')}: <b>${formatDuration(d.p95DurationSeconds)}</b><br/>${i18n.t('Run Count')}: ${d.runCount}`
            },
            series: [
                {
                    type: 'bar',
                    name: i18n.t('Avg Duration'),
                    data: durations.map((d) => d.avgDurationSeconds),
                    itemStyle: { color: COLOR_SUCCESS },
                    label: {
                        formatter: ({ dataIndex }) => {
                            const d = durations[dataIndex]
                            return d ? formatDuration(d.avgDurationSeconds) : ''
                        },
                    },
                },
                {
                    type: 'bar',
                    name: i18n.t('P95 Duration'),
                    data: durations.map((d) => d.p95DurationSeconds),
                    itemStyle: { color: COLOR_RUNNING },
                    label: {
                        formatter: ({ dataIndex }) => {
                            const d = durations[dataIndex]
                            return d ? formatDuration(d.p95DurationSeconds) : ''
                        },
                    },
                },
            ],
        })
        return {
            summaryText: summary,
            chartOptions: { option: opts, height },
        }
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
                <EChart
                    option={chartOptions.option}
                    height={chartOptions.height}
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
