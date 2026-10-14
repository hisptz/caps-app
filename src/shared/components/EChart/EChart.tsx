import { BarChart } from 'echarts/charts'
import type { BarSeriesOption } from 'echarts/charts'
import {
    GridComponent,
    LegendComponent,
    TooltipComponent,
} from 'echarts/components'
import type {
    GridComponentOption,
    LegendComponentOption,
    TooltipComponentOption,
} from 'echarts/components'
import * as echarts from 'echarts/core'
import type { ComposeOption } from 'echarts/core'
import { SVGRenderer } from 'echarts/renderers'
import React, { useEffect, useRef } from 'react'

echarts.use([
    BarChart,
    GridComponent,
    LegendComponent,
    TooltipComponent,
    SVGRenderer,
])

export type EChartOption = ComposeOption<
    | BarSeriesOption
    | GridComponentOption
    | LegendComponentOption
    | TooltipComponentOption
>

type EChartProps = {
    option: EChartOption
    height: number
}

export const EChart: React.FC<EChartProps> = ({ option, height }) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const chartRef = useRef<echarts.ECharts | null>(null)

    useEffect(() => {
        const el = containerRef.current
        if (!el) {
            return
        }
        const chart = echarts.init(el, undefined, { renderer: 'svg' })
        chartRef.current = chart
        const observer =
            typeof ResizeObserver === 'undefined'
                ? null
                : new ResizeObserver(() => chart.resize())
        observer?.observe(el)
        return () => {
            observer?.disconnect()
            chart.dispose()
            chartRef.current = null
        }
    }, [])

    useEffect(() => {
        chartRef.current?.setOption(option, { notMerge: true })
    }, [option])

    useEffect(() => {
        chartRef.current?.resize()
    }, [height])

    return <div ref={containerRef} style={{ width: '100%', height }} />
}
