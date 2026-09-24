import { useDataEngine } from '@dhis2/app-runtime'
import { useMemo } from 'react'
import { useParams } from 'react-router'
import { usePipelineDetailQuery } from '@/modules/monitoring/hooks/capsMonitoringHooks'
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

    const predictionSetupId = useMemo(() => {
        const steps = pipeline?.steps ?? []
        for (const step of steps) {
            if (step.handlerKey !== 'prediction-trigger') {
                continue
            }
            const id = step.handlerConfig?.predictionSetupId
            if (typeof id === 'number') {
                return id
            }
        }
        return undefined
    }, [pipeline])

    const { data } = usePredictionSetupQuery(engine, predictionSetupId)

    return data?.setup ?? undefined
}
