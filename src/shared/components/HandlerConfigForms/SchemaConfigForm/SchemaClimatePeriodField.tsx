import i18n from '@dhis2/d2-i18n'
import React from 'react'
import { useController, useFormContext, useWatch } from 'react-hook-form'
import { FixedPeriodFields } from '../ClimateOpenEoCreateConfig/components/ClimateDatasetPeriodSelector'
import {
    PERIOD_UNIT_LABEL,
    RollingPeriodFields,
} from '../ClimateOpenEoCreateConfig/components/RollingPeriodFields'
import type { HandlerPeriodType } from '../ClimateOpenEoCreateConfig/utils/climateDatasetPeriodUtils'
import { getCoverageYearRange } from '../ClimateOpenEoCreateConfig/utils/climateDatasetPeriodUtils'
import {
    type PeriodMode,
    periodForMode,
    periodModeOf,
} from '../ClimateOpenEoCreateConfig/utils/climatePeriod'
import { ConfigLabeledControl } from '../ConfigLabeledControl'
import { SchemaGroup } from './SchemaGroup'
import {
    formSectionGrids,
    SegmentedControl,
    SingleSelectControl,
} from '@/shared/components/ui/FormPrimitives'

const PERIOD_TYPES: HandlerPeriodType[] = ['daily', 'weekly', 'monthly']

const MODE_OPTIONS = [
    { value: 'rolling', label: i18n.t('Latest periods') },
    { value: 'fixed', label: i18n.t('Fixed range') },
] as const

function asPeriodType(value: unknown): HandlerPeriodType {
    return PERIOD_TYPES.includes(value as HandlerPeriodType)
        ? (value as HandlerPeriodType)
        : 'monthly'
}

export interface SchemaClimatePeriodFieldProps {
    name: string
    label: string
    helpText?: string
    required: boolean
}

export function SchemaClimatePeriodField({
    name,
    label,
    helpText,
    required,
}: SchemaClimatePeriodFieldProps): React.ReactElement {
    const { setValue } = useFormContext()
    const period = useWatch({ name }) as Record<string, unknown> | undefined
    const periodTypeField = useController({ name: `${name}.periodType` })
    const periodType = asPeriodType(period?.periodType)
    const mode = periodModeOf(period)
    const { minYear, maxYear } = getCoverageYearRange(undefined, undefined)

    function switchTo(nextMode: PeriodMode, nextType: HandlerPeriodType): void {
        setValue(name, periodForMode(nextMode, nextType), { shouldDirty: true })
    }

    return (
        <SchemaGroup label={label} helpText={helpText} required={required}>
            <ConfigLabeledControl
                label={i18n.t('Covers')}
                helpText={
                    mode === 'rolling'
                        ? i18n.t(
                              'Each run covers recent {{unit}}, for scheduled pipelines.',
                              { unit: PERIOD_UNIT_LABEL[periodType] }
                          )
                        : i18n.t('Every run covers the same periods.')
                }
            >
                <SegmentedControl
                    name={`${name}-mode`}
                    value={mode}
                    options={MODE_OPTIONS}
                    onChange={(next) => switchTo(next, periodType)}
                    aria-label={i18n.t('Period')}
                />
            </ConfigLabeledControl>
            <div className={formSectionGrids.grid2}>
                <ConfigLabeledControl label={i18n.t('Period type')}>
                    <SingleSelectControl
                        name={periodTypeField.field.name}
                        value={periodType}
                        options={PERIOD_TYPES.map((value) => ({
                            value,
                            label:
                                value.charAt(0).toUpperCase() + value.slice(1),
                        }))}
                        onChange={(next) => switchTo(mode, asPeriodType(next))}
                    />
                </ConfigLabeledControl>
                {mode === 'rolling' ? (
                    <RollingPeriodFields
                        name={name}
                        periodType={periodType}
                        temporalExtent={undefined}
                    />
                ) : (
                    <FixedPeriodFields
                        name={name}
                        datasetId={periodType}
                        periodType={periodType}
                        temporalExtent={undefined}
                        minYear={minYear}
                        maxYear={maxYear}
                    />
                )}
            </div>
        </SchemaGroup>
    )
}
