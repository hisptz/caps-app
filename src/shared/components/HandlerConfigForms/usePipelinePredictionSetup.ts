import { useDataEngine } from '@dhis2/app-runtime'
import { useMemo } from 'react'
import { useParams } from 'react-router'
import { usePipelineDetailQuery } from '@/modules/monitoring/hooks/capsMonitoringHooks'
import { getPipelinePredictionSetupId } from '@/modules/prediction-coverage/utils/predictionCoverage'
import { usePredictionSetupQuery } from '@/shared/hooks/useEvaluationsQuery'
import type { PredictionSetup } from '@/shared/types/caps'

export function usePipelinePredictionSetup(): PredictionSetup | undefined {
    const engine = useDataEngine()
    const { id: pipelineId } = useParams<{ id: string }>()
    const { data: pipeline } = usePipelineDetailQuery(
        engine,
        pipelineId,
        Boolean(pipelineId)
    )

    const predictionSetupId = useMemo(
        () => getPipelinePredictionSetupId(pipeline?.steps ?? []),
        [pipeline]
    )

    const { data } = usePredictionSetupQuery(engine, predictionSetupId)

    return data?.setup ?? undefined
}
