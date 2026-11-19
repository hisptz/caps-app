import { useDataEngine } from '@dhis2/app-runtime'
import {
    useOcsPipelineOptionsQuery,
    useOcsPipelinesQuery,
} from './useOcsPipelines'

export interface OcsPipelinePeriodType {
    periodType?: string
    datasetName?: string
    isLoading: boolean
}

export function useOcsPipelinePeriodType(
    pipelineId: string | undefined
): OcsPipelinePeriodType {
    const engine = useDataEngine()
    const pipelinesQuery = useOcsPipelinesQuery(engine)
    const pipeline = pipelineId
        ? pipelinesQuery.data?.find((item) => item.spec.id === pipelineId)
        : undefined
    const datasetInput = pipeline?.inputs.find(
        (input) => input.kind === 'dataset'
    )
    const datasetId = datasetInput?.id
    const optionsQuery = useOcsPipelineOptionsQuery(engine, Boolean(datasetId))
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
