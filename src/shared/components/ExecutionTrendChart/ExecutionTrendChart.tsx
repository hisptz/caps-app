import i18n from '@dhis2/d2-i18n'
import type { Options } from 'highcharts'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
import React, { useId, useMemo } from 'react'
import classes from './ExecutionTrendChart.module.css'
import 'highcharts/modules/accessibility'

export type TrendChartPoint = {
    date: string
    completed: number
    failed: number
}

type ExecutionTrendChartProps = {
    points: TrendChartPoint[]
}

const COLOR_COMPLETED = '#48bb78'
const COLOR_FAILED = '#f56565'

export const ExecutionTrendChart: React.FC<ExecutionTrendChartProps> = ({
    points,
}) => {
    const summaryId = useId()

    const { summaryText, chartOptions } = useMemo(() => {
        if (points.length === 0) {
            return {
                summaryText: i18n.t('No trend data for this period.'),
                chartOptions: null as Options | null,
            }
        }
        const first = points[0]
        const last = points[points.length - 1]
        const totalCompleted = points.reduce((s, p) => s + p.completed, 0)
        const totalFailed = points.reduce((s, p) => s + p.failed, 0)
        const summary = i18n.t(
            'Trend from {{start}} to {{end}} — completed runs {{completed}}, failed runs {{failed}}.',
            {
                start: first.date,
                end: last.date,
                completed: String(totalCompleted),
                failed: String(totalFailed),
            }
        )
        const opts: Options = {
            chart: {
                type: 'column',
                height: 240,
                backgroundColor: 'transparent',
                style: { fontFamily: 'inherit' },
                spacing: [12, 8, 12, 8],
            },
            title: { text: undefined },
            credits: { enabled: false },
            accessibility: {
                description: summary,
            },
            legend: {
                align: 'center',
                verticalAlign: 'bottom',
                layout: 'horizontal',
                itemStyle: { fontWeight: 'normal' },
            },
            xAxis: {
                categories: points.map((p) => p.date.slice(5)),
                crosshair: true,
                lineColor: '#e2e8f0',
                tickColor: '#e2e8f0',
                labels: { style: { color: '#4a5568' } },
            },
            yAxis: {
                min: 0,
                title: { text: undefined },
                gridLineColor: '#e2e8f0',
                labels: { style: { color: '#718096' } },
            },
            tooltip: { shared: true },
            plotOptions: {
                column: {
                    borderWidth: 0,
                    borderRadius: 2,
                    groupPadding: 0.12,
                    pointPadding: 0.04,
                },
            },
            series: [
                {
                    type: 'column',
                    name: i18n.t('Completed'),
                    data: points.map((p) => p.completed),
                    color: COLOR_COMPLETED,
                },
                {
                    type: 'column',
                    name: i18n.t('Failed'),
                    data: points.map((p) => p.failed),
                    color: COLOR_FAILED,
                },
            ],
        }
        return { summaryText: summary, chartOptions: opts }
    }, [points])

    if (points.length === 0 || !chartOptions) {
        return (
            <p className={classes.empty} id={summaryId}>
                {i18n.t('No data to chart for this range.')}
            </p>
        )
    }

    return (
        <div className={classes.root} data-testid="execution-trend-chart">
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
        </div>
    )
}
