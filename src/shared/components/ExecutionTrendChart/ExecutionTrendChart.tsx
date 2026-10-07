import i18n from '@dhis2/d2-i18n'
import React, { useId, useMemo } from 'react'
import classes from './ExecutionTrendChart.module.css'
import { EChart, type EChartOption } from '@/shared/components/EChart'

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
const AXIS_LINE_COLOR = '#e2e8f0'
const CHART_HEIGHT = 240

export const ExecutionTrendChart: React.FC<ExecutionTrendChartProps> = ({
    points,
}) => {
    const summaryId = useId()

    const { summaryText, chartOptions } = useMemo(() => {
        if (points.length === 0) {
            return {
                summaryText: i18n.t('No trend data for this period.'),
                chartOptions: null as EChartOption | null,
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
        const opts: EChartOption = {
            animation: false,
            textStyle: { fontFamily: 'inherit' },
            grid: {
                left: 8,
                right: 8,
                top: 12,
                bottom: 36,
                containLabel: true,
            },
            legend: { bottom: 0, left: 'center', orient: 'horizontal' },
            xAxis: {
                type: 'category',
                data: points.map((p) => p.date.slice(5)),
                axisLine: { lineStyle: { color: AXIS_LINE_COLOR } },
                axisTick: { lineStyle: { color: AXIS_LINE_COLOR } },
                axisLabel: { color: '#4a5568' },
            },
            yAxis: {
                type: 'value',
                min: 0,
                minInterval: 1,
                splitLine: { lineStyle: { color: AXIS_LINE_COLOR } },
                axisLabel: { color: '#718096' },
            },
            tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
            series: [
                {
                    type: 'bar',
                    name: i18n.t('Completed'),
                    data: points.map((p) => p.completed),
                    itemStyle: {
                        color: COLOR_COMPLETED,
                        borderRadius: [2, 2, 0, 0],
                    },
                    barCategoryGap: '24%',
                    barGap: '8%',
                },
                {
                    type: 'bar',
                    name: i18n.t('Failed'),
                    data: points.map((p) => p.failed),
                    itemStyle: {
                        color: COLOR_FAILED,
                        borderRadius: [2, 2, 0, 0],
                    },
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
                <EChart option={chartOptions} height={CHART_HEIGHT} />
            </div>
        </div>
    )
}
