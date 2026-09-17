import { useDataEngine } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import {
    createFixedPeriodFromPeriodId,
    generateFixedPeriods,
} from '@dhis2/multi-calendar-dates'
import {
    CircularLoader,
    SingleSelectField,
    SingleSelectOption,
} from '@dhis2/ui'
import { uniqBy } from 'lodash-es'
import React, { useMemo, useState } from 'react'
import { Controller, useFormContext, useWatch } from 'react-hook-form'
import { useClimateTemplatesQuery } from '@/modules/climate-data/hooks/useClimateTemplatesQuery'
import {
    getTemplateTemporalExtent,
    isFutureTemplate,
} from '@/modules/climate-data/utils/template'
import { SingleSelectControl } from '@/shared/components/ui/FormPrimitives'

export function IngestionPeriodSelector() {
    const [year, setYear] = useState<number>(new Date().getFullYear())
    const engine = useDataEngine()
    const datasetTemplateId = useWatch({
        name: 'dataset_id',
    })
    const { getValues } = useFormContext()
    const { data, isLoading } = useClimateTemplatesQuery(engine)

    const selectedDatasetTemplate = useMemo(
        () => data?.find((template) => template.id === datasetTemplateId),
        [data, datasetTemplateId]
    )

    const periodOptions = useMemo(() => {
        if (!selectedDatasetTemplate) {
            return []
        }
        const periods = generateFixedPeriods({
            calendar: 'gregory',
            year,
            yearsCount: 10,
            periodType:
                selectedDatasetTemplate.period_type.toUpperCase() as unknown as Parameters<
                    typeof generateFixedPeriods
                >[0]['periodType'],
        })
        const selectedPeriods = (getValues('periodIds') || []).map(
            (periodId: string) =>
                createFixedPeriodFromPeriodId({
                    periodId: periodId,
                    calendar: 'iso8601',
                })
        )

        return uniqBy([...periods, ...selectedPeriods], 'id')
    }, [selectedDatasetTemplate, year])

    if (!datasetTemplateId) {
        return null
    }

    if (isFutureTemplate(selectedDatasetTemplate)) {
        return null
    }

    if (isLoading) {
        return (
            <div
                style={{
                    width: '100%',
                    height: 300,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <CircularLoader small />
            </div>
        )
    }

    const temporalExtent = getTemplateTemporalExtent(selectedDatasetTemplate)

    const coverageHint = temporalExtent
        ? i18n.t('Available coverage: {{start}} – {{end}}', {
              start: temporalExtent.begin,
              end: temporalExtent.end ?? i18n.t('Present'),
          })
        : undefined

    return (
        <Controller
            name="periodIds"
            render={({ field, fieldState }) => {
                const [startId, endId] = field.value ?? []
                const startPeriod = periodOptions.find((p) => p.id === startId)
                const endOptions = startPeriod
                    ? periodOptions.filter(
                          (p) => p.startDate >= startPeriod.startDate
                      )
                    : periodOptions

                return (
                    <div style={{ display: 'flex', gap: 8 }}>
                        <div style={{ flex: 1 }}>
                            <SingleSelectField
                                label={i18n.t('Start period')}
                                required
                                helpText={coverageHint}
                                selected={startId ?? ''}
                                error={Boolean(fieldState.error)}
                                validationText={fieldState.error?.message}
                                onChange={({ selected }) => {
                                    const nextStart = periodOptions.find(
                                        (p) => p.id === selected
                                    )
                                    const currentEnd = periodOptions.find(
                                        (p) => p.id === endId
                                    )
                                    const keepEnd =
                                        nextStart &&
                                        currentEnd &&
                                        currentEnd.startDate >=
                                            nextStart.startDate
                                    field.onChange(
                                        keepEnd ? [selected, endId] : [selected]
                                    )
                                }}
                            >
                                {periodOptions.map(({ id, name }) => (
                                    <SingleSelectOption
                                        label={name}
                                        value={id}
                                        key={id}
                                    />
                                ))}
                            </SingleSelectField>
                        </div>
                        <div style={{ flex: 1 }}>
                            <SingleSelectField
                                label={i18n.t('End period')}
                                helpText={i18n.t(
                                    'Leave empty to ingest just the start period.'
                                )}
                                disabled={!startId}
                                selected={endId ?? ''}
                                onChange={({ selected }) =>
                                    field.onChange(
                                        selected
                                            ? [startId, selected]
                                            : [startId]
                                    )
                                }
                            >
                                {endOptions.map(({ id, name }) => (
                                    <SingleSelectOption
                                        label={name}
                                        value={id}
                                        key={id}
                                    />
                                ))}
                            </SingleSelectField>
                        </div>
                        <div style={{ paddingTop: 20 }}>
                            <SingleSelectControl
                                name="year"
                                options={Array.from(new Array(10)).map(
                                    (_, index) => {
                                        const currentYear =
                                            new Date().getFullYear()
                                        const optionYear = currentYear - index
                                        return {
                                            label: optionYear.toString(),
                                            value: optionYear.toString(),
                                        }
                                    }
                                )}
                                value={year.toString()}
                                onChange={(nextYear) => {
                                    const parsed = Number.parseInt(nextYear, 10)
                                    if (!Number.isNaN(parsed)) {
                                        setYear(parsed)
                                    }
                                }}
                            />
                        </div>
                    </div>
                )
            }}
        />
    )
}
