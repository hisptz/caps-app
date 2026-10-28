import React from 'react'
import { AlertGenerationConfig } from './AlertGenerationConfig'
import type { AlertGenerationConfigProps } from './AlertGenerationConfig'
import { Dhis2AnalyticsRunConfig } from './Dhis2AnalyticsRunConfig'
import type { Dhis2AnalyticsRunConfigProps } from './Dhis2AnalyticsRunConfig'
import { Dhis2DataUploadConfig } from './Dhis2DataUploadConfig'
import type { Dhis2DataUploadConfigProps } from './Dhis2DataUploadConfig'
import { Dhis2InstancePullConfig } from './Dhis2InstancePullConfig/Dhis2InstancePullConfig'
import type { Dhis2InstancePullConfigProps } from './Dhis2InstancePullConfig/Dhis2InstancePullConfig'
import { Dhis2InstancePushConfig } from './Dhis2InstancePushConfig/Dhis2InstancePushConfig'
import type { Dhis2InstancePushConfigProps } from './Dhis2InstancePushConfig/Dhis2InstancePushConfig'
import type { Dhis2NotifyConfigProps } from './Dhis2NotifyConfig'
import { Dhis2NotifyConfig } from './Dhis2NotifyConfig'
import { PredictionDataDownloadConfig } from './PredictionDataDownloadConfig'
import type { PredictionDataDownloadConfigProps } from './PredictionDataDownloadConfig'
import { PredictionPollConfig } from './PredictionPollConfig'
import type { PredictionPollConfigProps } from './PredictionPollConfig'
import { PredictionTriggerConfig } from './PredictionTriggerConfig/PredictionTriggerConfig'
import type { PredictionTriggerConfigProps } from './PredictionTriggerConfig/PredictionTriggerConfig'
import { ThresholdGenerationConfig } from './ThresholdGenerationConfig'
import type { ThresholdGenerationConfigProps } from './ThresholdGenerationConfig'
import type { ClimateOpenEoCreateConfigProps } from '@/shared/components/HandlerConfigForms/ClimateOpenEoCreateConfig/ClimateOpenEoCreateConfig'
import { ClimateOpenEoCreateConfig } from '@/shared/components/HandlerConfigForms/ClimateOpenEoCreateConfig/ClimateOpenEoCreateConfig'
import { OpenClimateServiceSyncConfig } from '@/shared/components/HandlerConfigForms/OpenClimateServiceSyncConfig/OpenClimateServiceSyncConfig'
import type { OpenClimateServiceSyncConfigProps } from '@/shared/components/HandlerConfigForms/OpenClimateServiceSyncConfig/OpenClimateServiceSyncConfig'

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
        case 'prediction-poll':
            return (
                <PredictionPollConfig
                    value={value as PredictionPollConfigProps['value']}
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
        case 'open-climate-service-sync':
            return (
                <OpenClimateServiceSyncConfig
                    value={value as OpenClimateServiceSyncConfigProps['value']}
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
        case 'dhis2-instance-pull':
            return (
                <Dhis2InstancePullConfig
                    value={value as Dhis2InstancePullConfigProps['value']}
                    onChange={onChange}
                />
            )
        case 'dhis2-instance-push':
            return (
                <Dhis2InstancePushConfig
                    value={value as Dhis2InstancePushConfigProps['value']}
                    onChange={onChange}
                />
            )
        case 'dhis2-data-upload':
            return (
                <Dhis2DataUploadConfig
                    value={value as Dhis2DataUploadConfigProps['value']}
                    onChange={onChange}
                />
            )
        case 'dhis2-notify':
            return (
                <Dhis2NotifyConfig
                    value={value as Dhis2NotifyConfigProps['value']}
                    onChange={onChange}
                />
            )
        default:
            return null
    }
}
