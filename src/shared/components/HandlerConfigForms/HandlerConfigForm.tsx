import React from 'react'
import { AlertGenerationConfig } from './AlertGenerationConfig'
import type { AlertGenerationConfigProps } from './AlertGenerationConfig'
import { Dhis2AnalyticsRunConfig } from './Dhis2AnalyticsRunConfig'
import type { Dhis2AnalyticsRunConfigProps } from './Dhis2AnalyticsRunConfig'
import { PredictionDataDownloadConfig } from './PredictionDataDownloadConfig'
import type { PredictionDataDownloadConfigProps } from './PredictionDataDownloadConfig'
import { PredictionTriggerConfig } from './PredictionTriggerConfig/PredictionTriggerConfig'
import type { PredictionTriggerConfigProps } from './PredictionTriggerConfig/PredictionTriggerConfig'
import { ThresholdGenerationConfig } from './ThresholdGenerationConfig'
import type { ThresholdGenerationConfigProps } from './ThresholdGenerationConfig'
import type { ClimateOpenEoCreateConfigProps } from '@/shared/components/HandlerConfigForms/ClimateOpenEoCreateConfig/ClimateOpenEoCreateConfig'
import { ClimateOpenEoCreateConfig } from '@/shared/components/HandlerConfigForms/ClimateOpenEoCreateConfig/ClimateOpenEoCreateConfig'

export interface HandlerConfigFormProps {
    handlerKey: string | null
    value: Record<string, unknown> | null
    onChange: (v: Record<string, unknown>) => void
}

export function HandlerConfigForm({
    handlerKey,
    value,
    onChange,
}: HandlerConfigFormProps): React.ReactElement | null {
    switch (handlerKey) {
        case 'prediction-trigger':
            return (
                <PredictionTriggerConfig
                    value={value as PredictionTriggerConfigProps['value']}
                    onChange={onChange}
                />
            )
        case 'threshold-generation':
            return (
                <ThresholdGenerationConfig
                    value={value as ThresholdGenerationConfigProps['value']}
                    onChange={onChange}
                />
            )
        case 'alert-generation':
            return (
                <AlertGenerationConfig
                    value={value as AlertGenerationConfigProps['value']}
                    onChange={onChange}
                />
            )
        case 'climate-openeo-create':
            return (
                <ClimateOpenEoCreateConfig
                    value={value as ClimateOpenEoCreateConfigProps['value']}
                    onChange={onChange}
                />
            )
        case 'prediction-data-download':
            return (
                <PredictionDataDownloadConfig
                    value={value as PredictionDataDownloadConfigProps['value']}
                    onChange={onChange}
                />
            )
        case 'dhis2-analytics-run':
            return (
                <Dhis2AnalyticsRunConfig
                    value={value as Dhis2AnalyticsRunConfigProps['value']}
                    onChange={onChange}
                />
            )
        default:
            return null
    }
}
