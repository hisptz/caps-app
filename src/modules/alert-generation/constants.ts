import i18n from '@dhis2/d2-i18n'
import type { OrgUnitConfig as AlertOrgUnitConfig } from '@/modules/org-unit-config/constants'

export type { AlertOrgUnitConfig }

export type AlertPeriodConfig = {
    periods: string[]
}

export type AlertGenerationConfig = {
    orgUnit: AlertOrgUnitConfig
    period: AlertPeriodConfig
    thresholdDataElementId: string
    valueDataElementIds: string[]
    aggregationType?: string
}

export type AlertGenerationContext = {
    orgUnit: AlertOrgUnitConfig
    period: AlertPeriodConfig
}

export const DEFAULT_AGGREGATION_TYPE = 'SUM'

export function alertPeriodHelpText(): string {
    return i18n.t('DHIS2 periods')
}
