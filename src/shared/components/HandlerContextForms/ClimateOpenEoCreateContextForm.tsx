import { useDataEngine } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import {
    createFixedPeriodFromPeriodId,
    generateFixedPeriods,
} from '@dhis2/multi-calendar-dates'
import { SimpleSingleSelectField } from '@dhis2/ui'
import React, { useEffect, useMemo, useState } from 'react'
import { useController } from 'react-hook-form'
import {
    filterPeriodsWithinCoverage,
    generatePeriodsForYears,
    getCoverageYearRange,
    getDatasetTemporalExtent,
    type HandlerPeriodType,
} from '../HandlerConfigForms/ClimateOpenEoCreateConfig/utils/climateDatasetPeriodUtils'
import { get, set } from '../HandlerConfigForms/configHelpers'
import { ConfigLabeledControl } from '../HandlerConfigForms/ConfigLabeledControl'
import { OrgUnitSection } from '../HandlerConfigForms/OrgUnitSection'
import { useClimateDatasetDetailQuery } from '@/modules/climate-data/hooks/useClimateDatasetDetailQuery'
import {
    FormSection,
    formSectionGrids,
    SegmentedControl,
} from '@/shared/components/ui/FormPrimitives'

export interface ClimateOpenEoCreateContextFormProps {
    stepId: string
    handlerConfig?: Record<string, unknown> | null
}

const PERIOD_TYPE_OPTIONS = [
    { value: 'daily', label: i18n.t('Daily') },
    { value: 'weekly', label: i18n.t('Weekly') },
    { value: 'monthly', label: i18n.t('Monthly') },
] as const

export function ClimateOpenEoCreateContextForm({
    stepId,
    handlerConfig,
}: ClimateOpenEoCreateContextFormProps): React.ReactElement {
    const { field } = useController({
        name: `stepContexts.${stepId}`,
    })
    const value = field.value as Record<string, unknown> | null
    const onChange = field.onChange

    const periodType = (get(value, 'period.periodType') as string) || 'monthly'
    const periodId = get(value, 'period.id') as string | undefined
    const periodEndId = (get(value, 'period.endId') as string) || undefined

    const engine = useDataEngine()
    const datasetId =
        typeof handlerConfig?.datasetId === 'string'
            ? handlerConfig.datasetId
            : undefined
    const { data: dataset } = useClimateDatasetDetailQuery(engine, datasetId)
    const temporalExtent = getDatasetTemporalExtent(dataset)
    const { minYear, maxYear } = getCoverageYearRange(
        temporalExtent?.start,
        temporalExtent?.end
    )

    const selectedPeriodYear = periodId
        ? Number.parseInt(periodId.slice(0, 4), 10)
        : Number.NaN
    const [year, setYear] = useState(
        Number.isNaN(selectedPeriodYear) ? maxYear : selectedPeriodYear
    )

    useEffect(() => {
        setYear((current) => (current > maxYear ? maxYear : current))
    }, [datasetId, maxYear])

    const periodOptions = useMemo(() => {
        const pt = periodType.toUpperCase() as 'DAILY' | 'WEEKLY' | 'MONTHLY'
        const periods = generateFixedPeriods({
            periodType: pt,
            calendar: 'iso8601',
            year,
        })

        return filterPeriodsWithinCoverage(
            periods,
            temporalExtent?.start,
            temporalExtent?.end
        ).map((period) => ({ label: period.name, value: period.id }))
    }, [periodType, year, temporalExtent?.start, temporalExtent?.end])

    const yearOptions = useMemo(() => {
        const options = []
        for (let y = maxYear; y >= minYear; y -= 1) {
            options.push({ label: String(y), value: String(y) })
        }
        return options
    }, [minYear, maxYear])

    // Not bound to the year filter: a run may end in a later year than it starts.
    const startPeriodStartDate = periodId
        ? createFixedPeriodFromPeriodId({
              calendar: 'iso8601',
              periodId,
          }).startDate
        : undefined

    const endPeriodOptions = useMemo(() => {
        if (!periodId) {
            return []
        }
        const startYear = Number.parseInt(periodId.slice(0, 4), 10)
        if (Number.isNaN(startYear)) {
            return []
        }

        return filterPeriodsWithinCoverage(
            generatePeriodsForYears(
                periodType as HandlerPeriodType,
                startYear,
                Math.max(startYear, maxYear)
            ),
            temporalExtent?.start,
            temporalExtent?.end
        )
            .filter(
                (period) =>
                    !startPeriodStartDate ||
                    period.startDate > startPeriodStartDate
            )
            .map((period) => ({ label: period.name, value: period.id }))
    }, [
        periodId,
        periodType,
        startPeriodStartDate,
        maxYear,
        temporalExtent?.start,
        temporalExtent?.end,
    ])

    // Drop an end period that the current start leaves behind.
    useEffect(() => {
        if (!periodEndId) {
            return
        }
        const stillValid = endPeriodOptions.some(
            (option) => option.value === periodEndId
        )
        if (!stillValid) {
            onChange(set(value, 'period.endId', undefined))
        }
    }, [endPeriodOptions, periodEndId, onChange, value])

    const coverageHint = temporalExtent
        ? i18n.t('Available coverage: {{start}} – {{end}}', {
              start: temporalExtent.start,
              end: temporalExtent.end,
          })
        : undefined

    const periodValueLabel = periodId
        ? createFixedPeriodFromPeriodId({
              calendar: 'iso8601',
              periodId,
          }).displayName
        : undefined

    const periodEndValueLabel = periodEndId
        ? createFixedPeriodFromPeriodId({
              calendar: 'iso8601',
              periodId: periodEndId,
          }).displayName
        : undefined

    function handleOrgUnitChange(orgUnit: Record<string, unknown>): void {
        onChange({ ...(value ?? {}), ...orgUnit })
    }

    return (
        <>
            <FormSection title={i18n.t('Period')} tight>
                <div className={formSectionGrids.grid2}>
                    <ConfigLabeledControl
                        label={i18n.t('Period type')}
                        required
                    >
                        <SegmentedControl
                            name="climate-context-period-type"
                            value={periodType}
                            options={PERIOD_TYPE_OPTIONS}
                            onChange={(selected) =>
                                onChange(
                                    set(value, 'period.periodType', selected)
                                )
                            }
                            aria-label={i18n.t('Period type')}
                        />
                    </ConfigLabeledControl>
                    <SimpleSingleSelectField
                        name="climate-context-year"
                        label={i18n.t('Year')}
                        value={String(year)}
                        onChange={(next) => {
                            const parsed = Number.parseInt(next, 10)
                            if (!Number.isNaN(parsed)) {
                                setYear(parsed)
                            }
                        }}
                        options={yearOptions}
                    />
                    <SimpleSingleSelectField
                        name="climate-context-period-id"
                        label={i18n.t('Start period')}
                        helpText={coverageHint}
                        value={periodId ?? ''}
                        valueLabel={periodValueLabel}
                        onChange={(next) =>
                            onChange(set(value, 'period.id', next))
                        }
                        options={periodOptions}
                        disabled={periodOptions.length === 0}
                    />
                    <SimpleSingleSelectField
                        name="climate-context-period-end-id"
                        label={i18n.t('End period')}
                        helpText={i18n.t(
                            'Optional. Leave empty to run just the start period.'
                        )}
                        value={periodEndId ?? ''}
                        valueLabel={periodEndValueLabel}
                        clearable
                        clearText={i18n.t('Clear')}
                        filterable={endPeriodOptions.length > 20}
                        filterPlaceholder={i18n.t('Search periods')}
                        noMatchText={i18n.t('No periods match')}
                        onChange={(next) =>
                            onChange(
                                set(value, 'period.endId', next || undefined)
                            )
                        }
                        options={endPeriodOptions}
                        disabled={endPeriodOptions.length === 0}
                    />
                </div>
            </FormSection>
            <FormSection
                title={i18n.t('Organisation units')}
                description={i18n.t('Override org units for this run')}
                tight
            >
                <OrgUnitSection value={value} onChange={handleOrgUnitChange} />
            </FormSection>
        </>
    )
}
