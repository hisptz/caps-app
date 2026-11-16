import { useDataEngine } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import {
    createFixedPeriodFromPeriodId,
    generateFixedPeriods,
} from '@dhis2/multi-calendar-dates'
import {
    CircularLoader,
    Field,
    NoticeBox,
    SingleSelectField,
    SingleSelectOption,
} from '@dhis2/ui'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useController, useFormContext, useWatch } from 'react-hook-form'
import { ConfigLabeledControl } from '../../ConfigLabeledControl'
import {
    filterPeriodsWithinCoverage,
    generatePeriodsForYears,
    getCoverageYearRange,
    getDatasetTemporalExtent,
    type HandlerPeriodType,
    normalizeDatasetPeriodType,
} from '../utils/climateDatasetPeriodUtils'
import {
    type PeriodMode,
    periodForMode,
    periodModeOf,
} from '../utils/climatePeriod'
import { PERIOD_UNIT_LABEL, RollingPeriodFields } from './RollingPeriodFields'
import type { ClimateTemporalExtent } from '@/capsApi/types'
import { useClimateCollectionQuery } from '@/modules/climate-data/hooks/useClimateCollectionsQuery'
import {
    formSectionGrids,
    SegmentedControl,
    SingleSelectControl,
} from '@/shared/components/ui/FormPrimitives'

const PERIOD_FIELD = 'handlerConfig.period'

/** Finest first: a dataset can give its own period type or any coarser one. */
const PERIOD_TYPES: HandlerPeriodType[] = ['daily', 'weekly', 'monthly']

const PERIOD_TYPE_LABEL: Record<HandlerPeriodType, string> = {
    daily: i18n.t('Daily'),
    weekly: i18n.t('Weekly'),
    monthly: i18n.t('Monthly'),
}

const MODE_OPTIONS = [
    { value: 'fixed', label: i18n.t('Fixed range') },
    { value: 'rolling', label: i18n.t('Latest periods') },
] as const

function FixedPeriodFields({
    datasetId,
    periodType,
    temporalExtent,
    minYear,
    maxYear,
}: {
    datasetId: string
    periodType: HandlerPeriodType
    temporalExtent: ClimateTemporalExtent | undefined
    minYear: number
    maxYear: number
}): React.ReactElement {
    const periodIdField = useController({
        name: 'handlerConfig.period.id',
    })
    const periodEndIdField = useController({
        name: 'handlerConfig.period.endId',
    })

    const [year, setYear] = useState(maxYear)
    const previousDatasetIdRef = useRef<string | undefined>(undefined)

    useEffect(() => {
        setYear(maxYear)
    }, [datasetId, maxYear])

    useEffect(() => {
        if (
            previousDatasetIdRef.current !== undefined &&
            previousDatasetIdRef.current !== datasetId
        ) {
            periodIdField.field.onChange('')
            periodEndIdField.field.onChange(undefined)
        }
        previousDatasetIdRef.current = datasetId
    }, [datasetId, periodIdField.field.onChange])

    const periodOptions = useMemo(() => {
        const periods = generateFixedPeriods({
            periodType: periodType.toUpperCase() as
                | 'DAILY'
                | 'WEEKLY'
                | 'MONTHLY',
            calendar: 'iso8601',
            year,
        })

        return filterPeriodsWithinCoverage(
            periods,
            temporalExtent?.start,
            temporalExtent?.end
        ).map((period) => ({ label: period.name, value: period.id }))
    }, [periodType, year, temporalExtent?.start, temporalExtent?.end])

    useEffect(() => {
        const currentId = periodIdField.field.value
        if (!currentId || periodOptions.length === 0) {
            return
        }

        const stillValid = periodOptions.some(
            (option) => option.value === currentId
        )
        if (!stillValid) {
            periodIdField.field.onChange('')
        }
    }, [periodOptions, periodIdField.field])

    /**
     * The run may end in a later year than it starts, so the end list is not
     * bound to the year filter above: it runs from the start period to the end
     * of coverage.
     */
    const startPeriodStartDate = periodIdField.field.value
        ? createFixedPeriodFromPeriodId({
              calendar: 'iso8601',
              periodId: periodIdField.field.value,
          }).startDate
        : undefined

    const endPeriodOptions = useMemo(() => {
        if (!periodIdField.field.value) {
            return []
        }

        const startYear = Number.parseInt(
            periodIdField.field.value.slice(0, 4),
            10
        )
        if (Number.isNaN(startYear)) {
            return []
        }

        return filterPeriodsWithinCoverage(
            generatePeriodsForYears(
                periodType,
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
        periodType,
        periodIdField.field.value,
        startPeriodStartDate,
        maxYear,
        temporalExtent?.start,
        temporalExtent?.end,
    ])

    // An end period only means something after, and relative to, a start.
    useEffect(() => {
        const currentEndId = periodEndIdField.field.value
        if (!currentEndId) {
            return
        }
        const stillValid = endPeriodOptions.some(
            (option) => option.value === currentEndId
        )
        if (!stillValid) {
            periodEndIdField.field.onChange(undefined)
        }
    }, [endPeriodOptions, periodEndIdField.field])

    const yearOptions = useMemo(() => {
        const options = []
        for (let y = maxYear; y >= minYear; y -= 1) {
            options.push({ label: String(y), value: String(y) })
        }
        return options
    }, [minYear, maxYear])

    const coverageHint = temporalExtent
        ? i18n.t('Available coverage: {{start}} – {{end}}', {
              nsSeparator: '~~',
              start: temporalExtent.start,
              end: temporalExtent.end,
          })
        : undefined

    return (
        <>
            <Field
                label={i18n.t('Start period')}
                helpText={coverageHint}
                required
                validationText={periodIdField.fieldState.error?.message}
            >
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                        <SingleSelectControl
                            name="handlerConfig.period.id"
                            value={
                                periodOptions.length > 0
                                    ? periodIdField.field.value
                                    : ''
                            }
                            valueLabel={
                                periodIdField.field.value
                                    ? createFixedPeriodFromPeriodId({
                                          calendar: 'iso8601',
                                          periodId: periodIdField.field.value,
                                      }).displayName
                                    : undefined
                            }
                            error={!!periodIdField.fieldState.error?.message}
                            options={periodOptions}
                            onChange={(nextPeriodId) =>
                                periodIdField.field.onChange(nextPeriodId)
                            }
                            disabled={periodOptions.length === 0}
                        />
                    </div>
                    <SingleSelectControl
                        name="climate-dataset-period-year"
                        value={String(year)}
                        options={yearOptions}
                        onChange={(nextYear) => {
                            const parsed = Number.parseInt(nextYear, 10)
                            if (!Number.isNaN(parsed)) {
                                setYear(parsed)
                            }
                        }}
                    />
                </div>
            </Field>
            <Field
                label={i18n.t('End period')}
                helpText={i18n.t(
                    'Optional. Leave empty to run just the start period.'
                )}
                validationText={periodEndIdField.fieldState.error?.message}
            >
                <SingleSelectControl
                    name="handlerConfig.period.endId"
                    value={periodEndIdField.field.value ?? ''}
                    valueLabel={
                        periodEndIdField.field.value
                            ? createFixedPeriodFromPeriodId({
                                  calendar: 'iso8601',
                                  periodId: periodEndIdField.field.value,
                              }).displayName
                            : undefined
                    }
                    error={!!periodEndIdField.fieldState.error?.message}
                    options={endPeriodOptions}
                    filterable={endPeriodOptions.length > 20}
                    filterPlaceholder={i18n.t('Search periods')}
                    noMatchText={i18n.t('No periods match')}
                    clearable
                    clearText={i18n.t('Clear')}
                    onChange={(nextEndId) =>
                        periodEndIdField.field.onChange(nextEndId || undefined)
                    }
                    disabled={endPeriodOptions.length === 0}
                />
            </Field>
        </>
    )
}

export function ClimateDatasetPeriodSelector(): React.ReactElement | null {
    const engine = useDataEngine()
    const { setValue } = useFormContext()
    const datasetId = useWatch({ name: 'handlerConfig.datasetId' })
    const period = useWatch({ name: PERIOD_FIELD }) as
        | Record<string, unknown>
        | undefined
    const periodTypeField = useController({
        name: 'handlerConfig.period.periodType',
    })

    const {
        data: dataset,
        isLoading,
        error,
    } = useClimateCollectionQuery(engine, datasetId)

    const temporalExtent = getDatasetTemporalExtent(dataset)
    const datasetPeriodType = normalizeDatasetPeriodType(dataset?.periodType)
    // Open Climate Service adds daily values up to weeks or months, never the other way
    const periodTypes = datasetPeriodType
        ? PERIOD_TYPES.slice(PERIOD_TYPES.indexOf(datasetPeriodType))
        : []
    const stepPeriodType = normalizeDatasetPeriodType(
        periodTypeField.field.value as string | undefined
    )
    const normalizedPeriodType =
        stepPeriodType && periodTypes.includes(stepPeriodType)
            ? stepPeriodType
            : datasetPeriodType
    const { minYear, maxYear } = getCoverageYearRange(
        temporalExtent?.start,
        temporalExtent?.end
    )
    const mode = periodModeOf(period)

    // Keep the step's period type (e.g. weekly from a daily dataset); fall back to the
    // dataset's own when the step has none or one the dataset cannot give
    useEffect(() => {
        if (
            normalizedPeriodType &&
            periodTypeField.field.value !== normalizedPeriodType
        ) {
            periodTypeField.field.onChange(normalizedPeriodType)
        }
    }, [
        normalizedPeriodType,
        periodTypeField.field.value,
        periodTypeField.field.onChange,
    ])

    function switchPeriodType(next: HandlerPeriodType): void {
        setValue(PERIOD_FIELD, periodForMode(mode, next), {
            shouldDirty: true,
        })
    }

    function switchMode(next: PeriodMode): void {
        setValue(PERIOD_FIELD, periodForMode(next, normalizedPeriodType), {
            shouldDirty: true,
        })
    }

    if (!datasetId) {
        return null
    }

    if (isLoading) {
        return (
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: 120,
                }}
            >
                <CircularLoader small />
            </div>
        )
    }

    if (error) {
        return (
            <NoticeBox error title={i18n.t('Could not load dataset coverage')}>
                {i18n.t(
                    'Select a dataset to configure the period within its available coverage.'
                )}
            </NoticeBox>
        )
    }

    if (!normalizedPeriodType) {
        return (
            <NoticeBox warning title={i18n.t('Unsupported period type')}>
                {i18n.t(
                    'This dataset uses a period type that is not supported for pipeline steps.'
                )}
            </NoticeBox>
        )
    }

    return (
        <>
            <ConfigLabeledControl
                label={i18n.t('Period')}
                helpText={
                    mode === 'rolling'
                        ? i18n.t(
                              'Each run covers recent {{unit}}, for scheduled pipelines.',
                              { unit: PERIOD_UNIT_LABEL[normalizedPeriodType] }
                          )
                        : i18n.t('Every run covers the same periods.')
                }
            >
                <SegmentedControl
                    name="climate-openeo-period-mode"
                    value={mode}
                    options={MODE_OPTIONS}
                    onChange={switchMode}
                    aria-label={i18n.t('Period')}
                />
            </ConfigLabeledControl>
            <div className={formSectionGrids.grid2}>
                <SingleSelectField
                    label={i18n.t('Period type')}
                    selected={normalizedPeriodType}
                    disabled={periodTypes.length < 2}
                    onChange={({ selected }) =>
                        switchPeriodType(selected as HandlerPeriodType)
                    }
                    helpText={
                        periodTypes.length < 2
                            ? i18n.t('The dataset is {{periodType}}', {
                                  periodType:
                                      PERIOD_TYPE_LABEL[
                                          datasetPeriodType!
                                      ].toLowerCase(),
                              })
                            : i18n.t(
                                  'The dataset is {{periodType}}; its values are combined into longer periods',
                                  {
                                      periodType:
                                          PERIOD_TYPE_LABEL[
                                              datasetPeriodType!
                                          ].toLowerCase(),
                                  }
                              )
                    }
                >
                    {periodTypes.map((type) => (
                        <SingleSelectOption
                            key={type}
                            value={type}
                            label={PERIOD_TYPE_LABEL[type]}
                        />
                    ))}
                </SingleSelectField>
                {mode === 'rolling' ? (
                    <RollingPeriodFields
                        name={PERIOD_FIELD}
                        periodType={normalizedPeriodType}
                        temporalExtent={temporalExtent}
                    />
                ) : (
                    <FixedPeriodFields
                        datasetId={datasetId}
                        periodType={normalizedPeriodType}
                        temporalExtent={temporalExtent}
                        minYear={minYear}
                        maxYear={maxYear}
                    />
                )}
            </div>
        </>
    )
}
