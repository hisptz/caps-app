// eslint-disable-next-line import/order
import i18n from '@dhis2/d2-i18n'
/** Mirrors caps-engine worker CALCULATION_METHOD_VALUES */
export const CALCULATION_METHOD_VALUES = [
    'mean',
    'SD',
    'median',
    'mean + 2SD',
    'mean + SD',
    'C-SUM',
    'C-SUM SD',
    'C-SUM + 1.96SD',
    '75th percentile',
    '25th percentile',
] as const

export type CalculationMethod = (typeof CALCULATION_METHOD_VALUES)[number]

/** Mirrors caps-engine ThresholdGenerationConfigSchema period.periodType */
export const THRESHOLD_PERIOD_TYPE_VALUES = [
    'Monthly',
    'Weekly',
    'Quarterly',
    'BiMonthly',
    'SixMonthly',
] as const

export type ThresholdPeriodType = (typeof THRESHOLD_PERIOD_TYPE_VALUES)[number]

export type ThresholdOutputSpec = {
    calculationMethod: CalculationMethod
    outputDataElementId: string
}

import type { OrgUnitConfig as ThresholdOrgUnitConfig } from '@/modules/org-unit-config/constants'

export type { ThresholdOrgUnitConfig }

export type ThresholdPeriodConfig = {
    years: string[]
    periodType: ThresholdPeriodType
    yearsToInclude?: number
}

export type ThresholdGenerationConfig = {
    orgUnit: ThresholdOrgUnitConfig
    period: ThresholdPeriodConfig
    dataElementIds: string[]
    aggregationType?: string
    calculationMethod?: CalculationMethod
    outputDataElementId?: string
    outputs?: ThresholdOutputSpec[]
}

export type ThresholdOutputMode = 'single' | 'batch'

export const DEFAULT_CALCULATION_METHOD: CalculationMethod = 'mean + 2SD'

export const DEFAULT_YEARS_TO_INCLUDE = 5

export const DEFAULT_AGGREGATION_TYPE = 'SUM'

/** i18n labels for calculation method select options */
export function calculationMethodLabel(method: CalculationMethod): string {
    switch (method) {
        case 'mean':
            return i18n.t('Mean')
        case 'SD':
            return i18n.t('SD')
        case 'median':
            return i18n.t('Median')
        case 'mean + 2SD':
            return i18n.t('Mean + 2 SD')
        case 'mean + SD':
            return i18n.t('Mean + SD')
        case 'C-SUM':
            return i18n.t('C-SUM')
        case 'C-SUM SD':
            return i18n.t('C-SUM SD')
        case 'C-SUM + 1.96SD':
            return i18n.t('C-SUM + 1.96 SD')
        case '75th percentile':
            return i18n.t('75th percentile')
        case '25th percentile':
            return i18n.t('25th percentile')
        default:
            return method
    }
}

export function thresholdPeriodTypeLabel(type: ThresholdPeriodType): string {
    switch (type) {
        case 'Monthly':
            return i18n.t('Monthly')
        case 'Weekly':
            return i18n.t('Weekly')
        case 'Quarterly':
            return i18n.t('Quarterly')
        case 'BiMonthly':
            return i18n.t('Bi-monthly')
        case 'SixMonthly':
            return i18n.t('Six-monthly')
        default:
            return type
    }
}
