import type { Options } from 'highcharts'

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

export type BarChartBaseArgs = {
    height: number
    summary: string
    categories: string[]
    series: Options['series']
}

export const barChartBase = ({
    height,
    summary,
    categories,
    series,
}: BarChartBaseArgs): Options => ({
    chart: {
        type: 'bar',
        height,
        backgroundColor: 'transparent',
        style: { fontFamily: 'inherit' },
        spacing: [10, 8, 10, 8],
    },
    title: { text: undefined },
    credits: { enabled: false },
    accessibility: { description: summary },
    legend: {
        align: 'center',
        verticalAlign: 'bottom',
        layout: 'horizontal',
        itemStyle: { fontWeight: 'normal' },
    },
    xAxis: {
        categories,
        lineColor: '#e2e8f0',
        tickColor: '#e2e8f0',
        labels: {
            style: { color: '#4a5568', fontSize: '11px' },
        },
    },
    yAxis: {
        min: 0,
        title: { text: undefined },
        gridLineColor: '#e2e8f0',
        labels: { style: { color: '#718096' } },
    },
    tooltip: {
        shared: true,
        outside: true,
    },
    plotOptions: {
        bar: {
            borderWidth: 0,
            borderRadius: 2,
            grouping: true,
            groupPadding: 0.12,
            pointPadding: 0.06,
        },
        series: {
            dataLabels: {
                enabled: true,
                style: {
                    fontSize: '10px',
                    fontWeight: 'normal',
                    color: '#4a5568',
                },
            },
        },
    },
    series,
})
