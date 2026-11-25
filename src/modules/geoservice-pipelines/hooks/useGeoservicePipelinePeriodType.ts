import { useDataEngine } from '@dhis2/app-runtime'
import {
    useGeoservicePipelineOptionsQuery,
    useGeoservicePipelinesQuery,
} from './useGeoservicePipelines'

export interface GeoservicePipelinePeriodType {
    periodType?: string
    datasetName?: string
    isLoading: boolean
}

export function useGeoservicePipelinePeriodType(
    pipelineId: string | undefined
): GeoservicePipelinePeriodType {
    const engine = useDataEngine()
    const pipelinesQuery = useGeoservicePipelinesQuery(engine)
    const pipeline = pipelineId
        ? pipelinesQuery.data?.find((item) => item.spec.id === pipelineId)
        : undefined
    const datasetInput = pipeline?.inputs.find(
        (input) => input.kind === 'dataset'
    )
    const datasetId = datasetInput?.id
    const optionsQuery = useGeoservicePipelineOptionsQuery(
        engine,
        Boolean(datasetId)
    )
    const dataset = datasetId
        ? optionsQuery.data?.datasets.find((item) => item.id === datasetId)
        : undefined

    return {
        periodType: dataset?.periodType?.toLowerCase(),
        datasetName: dataset?.name ?? datasetInput?.name,
        isLoading:
            Boolean(pipelineId) &&
            (pipelinesQuery.isLoading ||
                (Boolean(datasetId) && optionsQuery.isLoading)),
    }
}
