import React from 'react'
import { AlertGenerationContextForm } from './AlertGenerationContextForm'
import { ClimateOpenEoCreateContextForm } from './ClimateOpenEoCreateContextForm'
import { PredictionTriggerContextForm } from './PredictionTriggerContextForm'
import { ThresholdContextForm } from './ThresholdContextForm'

export interface HandlerContextFormProps {
    handlerKey: string
    stepId: string
    handlerConfig?: Record<string, unknown> | null
}

export function HandlerContextForm({
    handlerKey,
    stepId,
    handlerConfig,
}: HandlerContextFormProps): React.ReactElement | null {
    switch (handlerKey) {
        case 'prediction-trigger':
            return <PredictionTriggerContextForm stepId={stepId} />
        case 'climate-openeo-create':
            return (
                <ClimateOpenEoCreateContextForm
                    stepId={stepId}
                    handlerConfig={handlerConfig}
                />
            )
        case 'threshold-generation':
            return <ThresholdContextForm stepId={stepId} />
        case 'alert-generation':
            return <AlertGenerationContextForm stepId={stepId} />
        default:
            return null
    }
}
