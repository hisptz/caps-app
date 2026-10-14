import { useDataEngine } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import {
    createFixedPeriodFromPeriodId,
    generateFixedPeriods,
} from '@dhis2/multi-calendar-dates'
import { Checkbox, NoticeBox, SimpleSingleSelectField } from '@dhis2/ui'
import React, { useEffect, useMemo, useState } from 'react'
import { useController } from 'react-hook-form'
import { RollingPeriodFields } from '../HandlerConfigForms/ClimateOpenEoCreateConfig/components/RollingPeriodFields'
import {
    filterPeriodsWithinCoverage,
    generatePeriodsForYears,
    getCoverageYearRange,
    getDatasetTemporalExtent,
    type HandlerPeriodType,
    normalizeDatasetPeriodType,
} from '../HandlerConfigForms/ClimateOpenEoCreateConfig/utils/climateDatasetPeriodUtils'
import {
    describePeriod,
    fixedPeriodFrom,
    type PeriodMode,
    periodForMode,
    periodModeOf,
    rollingFieldsOf,
    rollingPeriod,
} from '../HandlerConfigForms/ClimateOpenEoCreateConfig/utils/climatePeriod'
import { get } from '../HandlerConfigForms/configHelpers'
import { ConfigLabeledControl } from '../HandlerConfigForms/ConfigLabeledControl'
import { OrgUnitSection } from '../HandlerConfigForms/OrgUnitSection'
import type { RunContextMode } from './HandlerContextForm'
import type { ClimateTemporalExtent } from '@/capsApi/types'
import { useClimateCollectionQuery } from '@/modules/climate-data/hooks/useClimateCollectionsQuery'
import {
    FormSection,
    formSectionGrids,
    SegmentedControl,
} from '@/shared/components/ui/FormPrimitives'

export interface ClimateOpenEoCreateContextFormProps {
    stepId: string
    handlerConfig?: Record<string, unknown> | null
    mode?: RunContextMode
}

/** Where a run's period comes from: the step (no override), or a fixed or rolling override. */
type PeriodSource = 'step' | PeriodMode

type Context = Record<string, unknown> | null

const STEP_OPTION = { value: 'step', label: i18n.t('Step’s period') } as const
const LATEST_OPTION = {
    value: 'rolling',
    label: i18n.t('Latest periods'),
} as const
const FIXED_OPTION = { value: 'fixed', label: i18n.t('Fixed range') } as const

const RUN_OPTIONS = [STEP_OPTION, LATEST_OPTION, FIXED_OPTION]
// A fixed range would cover the same dates on every scheduled run.
const SCHEDULE_OPTIONS = [STEP_OPTION, LATEST_OPTION]

const PERIOD_TYPE_OPTIONS = [
    { value: 'daily', label: i18n.t('Daily') },
    { value: 'weekly', label: i18n.t('Weekly') },
    { value: 'monthly', label: i18n.t('Monthly') },
] as const

function without(value: Context, key: string): Record<string, unknown> {
    const rest = { ...(value ?? {}) }
    delete rest[key]
    return rest
}

function FixedRunPeriodFields({
    value,
    onChange,
    temporalExtent,
    datasetId,
}: {
    value: Context
    onChange: (next: Record<string, unknown>) => void
    temporalExtent: ClimateTemporalExtent | undefined
    datasetId: string | undefined
}): React.ReactElement {
    const periodType = (get(value, 'period.periodType') as string) || 'monthly'
    const periodId = get(value, 'period.id') as string | undefined
    const periodEndId = (get(value, 'period.endId') as string) || undefined
    const { minYear, maxYear } = getCoverageYearRange(
        temporalExtent?.start,
        temporalExtent?.end
    )

    // The run's period replaces the step's whole (contextReplaces), so picking dates here
    // writes a clean fixed period, never fixed fields on top of a rolling one.
    function setFixedPeriod(key: 'periodType' | 'id' | 'endId', next: unknown) {
        onChange({
            ...(value ?? {}),
            period: {
                ...fixedPeriodFrom(
                    value?.period as Record<string, unknown> | undefined
                ),
                [key]: next,
            },
        })
    }

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
            setFixedPeriod('endId', undefined)
        }
    }, [endPeriodOptions, periodEndId, onChange, value])

    const coverageHint = temporalExtent
        ? i18n.t('Available coverage: {{start}} – {{end}}', {
              start: temporalExtent.start,
              end: temporalExtent.end,
          })
        : undefined

    return (
        <>
            <ConfigLabeledControl label={i18n.t('Period type')} required>
                <SegmentedControl
                    name="climate-context-period-type"
                    value={periodType}
                    options={PERIOD_TYPE_OPTIONS}
                    onChange={(selected) =>
                        setFixedPeriod('periodType', selected)
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
                valueLabel={
                    periodId
                        ? createFixedPeriodFromPeriodId({
                              calendar: 'iso8601',
                              periodId,
                          }).displayName
                        : undefined
                }
                onChange={(next) => setFixedPeriod('id', next)}
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
                valueLabel={
                    periodEndId
                        ? createFixedPeriodFromPeriodId({
                              calendar: 'iso8601',
                              periodId: periodEndId,
                          }).displayName
                        : undefined
                }
                clearable
                clearText={i18n.t('Clear')}
                filterable={endPeriodOptions.length > 20}
                filterPlaceholder={i18n.t('Search periods')}
                noMatchText={i18n.t('No periods match')}
                onChange={(next) => setFixedPeriod('endId', next || undefined)}
                options={endPeriodOptions}
                disabled={endPeriodOptions.length === 0}
            />
        </>
    )
}

/**
 * Overrides for one climate step on a manual run or a schedule. Left alone, a run uses the
 * step's period and org units, including later edits to the step: a schedule follows a rolling
 * step as it moves. An override replaces the step's period or org units whole.
 */
export function ClimateOpenEoCreateContextForm({
    stepId,
    handlerConfig,
    mode = 'run',
}: ClimateOpenEoCreateContextFormProps): React.ReactElement {
    const name = `stepContexts.${stepId}`
    const { field } = useController({ name })
    const value = field.value as Context
    const onChange = field.onChange

    const engine = useDataEngine()
    const datasetId =
        typeof handlerConfig?.datasetId === 'string'
            ? handlerConfig.datasetId
            : undefined
    const { data: dataset } = useClimateCollectionQuery(engine, datasetId)
    const temporalExtent = getDatasetTemporalExtent(dataset)

    const stepPeriod = handlerConfig?.period as
        | Record<string, unknown>
        | undefined
    const periodType: HandlerPeriodType =
        normalizeDatasetPeriodType(dataset?.periodType) ??
        (stepPeriod?.periodType as HandlerPeriodType | undefined) ??
        'monthly'
    const source: PeriodSource =
        value?.period === undefined
            ? 'step'
            : periodModeOf(value.period as Record<string, unknown>)

    function switchSource(next: PeriodSource): void {
        const rest = without(value, 'period')
        if (next === 'step') {
            onChange(rest)
            return
        }
        const stepMode = periodModeOf(stepPeriod)
        let period: Record<string, unknown>
        if (next === 'fixed') {
            period =
                stepMode === 'fixed'
                    ? fixedPeriodFrom(stepPeriod)
                    : { periodType }
        } else if (stepMode === 'rolling') {
            const { count, offset } = rollingFieldsOf(stepPeriod)
            period = rollingPeriod(periodType, count, offset)
        } else {
            period = periodForMode('rolling', periodType)
        }
        onChange({ ...rest, period })
    }

    const overridesOrgUnits = value?.orgUnit !== undefined

    function toggleOrgUnits(next: boolean): void {
        onChange(
            next
                ? {
                      ...(value ?? {}),
                      orgUnit: handlerConfig?.orgUnit ?? { levels: [] },
                  }
                : without(value, 'orgUnit')
        )
    }

    const stepPeriodSummary = describePeriod(stepPeriod)

    const orgUnitSection = (
        <FormSection
            title={i18n.t('Organisation units')}
            description={i18n.t(
                'Runs use the step’s organisation units unless you choose others here.'
            )}
            tight
        >
            <Checkbox
                label={i18n.t('Use other organisation units than the step’s')}
                checked={overridesOrgUnits}
                onChange={(e) => toggleOrgUnits(e.checked)}
            />
            {overridesOrgUnits && (
                <OrgUnitSection
                    value={value}
                    onChange={(orgUnit) =>
                        onChange({ ...(value ?? {}), ...orgUnit })
                    }
                />
            )}
        </FormSection>
    )

    return (
        <>
            <FormSection
                title={i18n.t('Period')}
                description={
                    mode === 'schedule'
                        ? i18n.t(
                              'Scheduled runs use the step’s period, including later edits to the step, or latest periods of their own.'
                          )
                        : i18n.t(
                              'This run uses the step’s period unless you choose another here, e.g. a fixed range to backfill history.'
                          )
                }
                tight
            >
                <ConfigLabeledControl label={i18n.t('Period for this run')}>
                    <SegmentedControl
                        name={`climate-context-period-source-${stepId}`}
                        value={source}
                        options={
                            mode === 'schedule' ? SCHEDULE_OPTIONS : RUN_OPTIONS
                        }
                        onChange={switchSource}
                        aria-label={i18n.t('Period for this run')}
                    />
                </ConfigLabeledControl>

                {source === 'step' && stepPeriodSummary && (
                    <p>{stepPeriodSummary}</p>
                )}

                {source === 'step' &&
                    mode === 'schedule' &&
                    periodModeOf(stepPeriod) === 'fixed' && (
                        <NoticeBox
                            warning
                            title={i18n.t(
                                'Every scheduled run covers the same dates'
                            )}
                        >
                            {i18n.t(
                                'This step uses a fixed range. Choose latest periods so each scheduled run moves forward.'
                            )}
                        </NoticeBox>
                    )}

                {source !== 'step' && (
                    <div className={formSectionGrids.grid2}>
                        {source === 'rolling' ? (
                            <RollingPeriodFields
                                name={`${name}.period`}
                                periodType={periodType}
                                temporalExtent={temporalExtent}
                            />
                        ) : (
                            <FixedRunPeriodFields
                                value={value}
                                onChange={onChange}
                                temporalExtent={temporalExtent}
                                datasetId={datasetId}
                            />
                        )}
                    </div>
                )}
            </FormSection>
            {orgUnitSection}
        </>
    )
}
