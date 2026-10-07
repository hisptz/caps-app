import type { BarSeriesOption } from 'echarts/charts'
import type { EChartOption } from '@/shared/components/EChart'

export const COLOR_SUCCESS = '#48bb78'
export const COLOR_RUNNING = '#4299e1'
export const COLOR_ERROR = '#f56565'
export const COLOR_WARNING = '#ed8936'

export const truncate = (s: string, max: number) =>
    s.length <= max ? s : `${s.slice(0, Math.max(0, max - 1))}…`

export const escapeHtml = (s: string) =>
    s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')

export const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (mins === 0) {
        return `${secs}s`
    }
    return `${mins}m ${secs}s`
}

export const AXIS_LINE_COLOR = '#e2e8f0'
export const AXIS_LABEL_COLOR = '#4a5568'
export const VALUE_LABEL_COLOR = '#718096'

export const tooltipDataIndex = (params: unknown): number | undefined => {
    const first = Array.isArray(params) ? params[0] : params
    return (first as { dataIndex?: number } | undefined)?.dataIndex
}

export type BarChartBaseArgs = {
    categories: string[]
    series: BarSeriesOption[]
    tooltipFormatter: (index: number) => string
}

/** Horizontal bar chart: categories on the y-axis, listed top to bottom. */
export const barChartBase = ({
    categories,
    series,
    tooltipFormatter,
}: BarChartBaseArgs): EChartOption => ({
    animation: false,
    textStyle: { fontFamily: 'inherit' },
    grid: {
        left: 8,
        right: 48,
        top: 10,
        bottom: series.length > 1 ? 36 : 10,
        containLabel: true,
    },
    legend: {
        show: series.length > 1,
        bottom: 0,
        left: 'center',
        orient: 'horizontal',
    },
    yAxis: {
        type: 'category',
        data: categories,
        inverse: true,
        axisLine: { lineStyle: { color: AXIS_LINE_COLOR } },
        axisTick: { lineStyle: { color: AXIS_LINE_COLOR } },
        axisLabel: { color: AXIS_LABEL_COLOR, fontSize: 11 },
    },
    xAxis: {
        type: 'value',
        min: 0,
        splitLine: { lineStyle: { color: AXIS_LINE_COLOR } },
        axisLabel: { color: VALUE_LABEL_COLOR },
    },
    tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        appendTo: 'body',
        formatter: (params) => {
            const index = tooltipDataIndex(params)
            return index === undefined ? '' : tooltipFormatter(index)
        },
    },
    series: series.map((s) => ({
        barCategoryGap: '24%',
        barGap: '12%',
        ...s,
        itemStyle: { borderRadius: [0, 2, 2, 0], ...s.itemStyle },
        label: {
            show: true,
            position: 'right',
            fontSize: 10,
            color: AXIS_LABEL_COLOR,
            ...s.label,
        },
    })) as BarSeriesOption[],
})
