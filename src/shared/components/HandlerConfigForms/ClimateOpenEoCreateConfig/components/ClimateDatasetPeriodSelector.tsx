import { useDataEngine } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import {
    createFixedPeriodFromPeriodId,
    generateFixedPeriods,
} from '@dhis2/multi-calendar-dates'
import { CircularLoader, Field, InputField, NoticeBox } from '@dhis2/ui'
import { capitalize } from 'lodash-es'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useController, useWatch } from 'react-hook-form'
import {
    filterPeriodsWithinCoverage,
    generatePeriodsForYears,
    getCoverageYearRange,
    getDatasetTemporalExtent,
    normalizeDatasetPeriodType,
} from '../utils/climateDatasetPeriodUtils'
import { useClimateDatasetDetailQuery } from '@/modules/climate-data/hooks/useClimateDatasetDetailQuery'
import {
    formSectionGrids,
    SingleSelectControl,
} from '@/shared/components/ui/FormPrimitives'

export function ClimateDatasetPeriodSelector(): React.ReactElement | null {
    const engine = useDataEngine()
    const datasetId = useWatch({ name: 'handlerConfig.datasetId' })
    const periodTypeField = useController({
        name: 'handlerConfig.period.periodType',
    })
    const periodIdField = useController({
        name: 'handlerConfig.period.id',
    })
    const periodEndIdField = useController({
        name: 'handlerConfig.period.endId',
    })

    const {
        data: dataset,
        isLoading,
        error,
    } = useClimateDatasetDetailQuery(engine, datasetId)

    const temporalExtent = getDatasetTemporalExtent(dataset)
    const normalizedPeriodType = normalizeDatasetPeriodType(
        dataset?.period_type
    )
    const { minYear, maxYear } = getCoverageYearRange(
        temporalExtent?.start,
        temporalExtent?.end
    )

    const [year, setYear] = useState(maxYear)
    const previousDatasetIdRef = useRef<string | undefined>(undefined)

    useEffect(() => {
        setYear(maxYear)
    }, [datasetId, maxYear])

    useEffect(() => {
        if (!normalizedPeriodType) {
            return
        }
        periodTypeField.field.onChange(normalizedPeriodType)

        if (
            previousDatasetIdRef.current !== undefined &&
            previousDatasetIdRef.current !== datasetId
        ) {
            periodIdField.field.onChange('')
            periodEndIdField.field.onChange(undefined)
        }

        previousDatasetIdRef.current = datasetId
    }, [
        datasetId,
        normalizedPeriodType,
        periodTypeField.field.onChange,
        periodIdField.field.onChange,
    ])

    const periodOptions = useMemo(() => {
        if (!normalizedPeriodType) {
            return []
        }

        const periods = generateFixedPeriods({
            periodType: normalizedPeriodType.toUpperCase() as
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
    }, [normalizedPeriodType, year, temporalExtent?.start, temporalExtent?.end])

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
        if (!normalizedPeriodType || !periodIdField.field.value) {
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
                normalizedPeriodType,
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
        normalizedPeriodType,
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

    const coverageHint = temporalExtent
        ? i18n.t('Available coverage: {{start}} – {{end}}', {
              start: temporalExtent.start,
              end: temporalExtent.end,
          })
        : undefined

    return (
        <div className={formSectionGrids.grid2}>
            <InputField
                label={i18n.t('Period type')}
                name="handlerConfig.period.periodType"
                value={capitalize(normalizedPeriodType)}
                disabled
                readOnly
                helpText={i18n.t('Derived from the selected dataset')}
            />
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
        </div>
    )
}
