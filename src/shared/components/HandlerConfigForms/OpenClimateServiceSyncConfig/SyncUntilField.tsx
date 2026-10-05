import i18n from '@dhis2/d2-i18n'
import { generateFixedPeriods } from '@dhis2/multi-calendar-dates'
import { CalendarInput, Field } from '@dhis2/ui'
import React, { useMemo, useState } from 'react'
import { useController } from 'react-hook-form'
import {
    monthEndDate,
    parseSyncEnd,
    type SyncEndGranularity,
} from '@/modules/open-climate-service-sync/utils/syncEnd'
import type { PipelineStepFormWithHandlerValues } from '@/modules/pipeline-detail/schemas/stepFormSchema'
import { SingleSelectControl } from '@/shared/components/ui/FormPrimitives'

export interface SyncUntilFieldProps {
    granularity: SyncEndGranularity
    minYear: number
}

export function SyncUntilField({
    granularity,
    minYear,
}: SyncUntilFieldProps): React.ReactElement {
    const { field, fieldState } = useController<
        PipelineStepFormWithHandlerValues,
        'handlerConfig.end'
    >({ name: 'handlerConfig.end' })
    const value = typeof field.value === 'string' ? field.value : ''
    const stored = parseSyncEnd(value)

    const currentYear = new Date().getFullYear()
    const [pickedYear, setPickedYear] = useState(currentYear)
    const year = stored?.year ?? pickedYear

    const yearOptions = useMemo(() => {
        const from = Math.min(minYear, year)
        const to = Math.max(currentYear, year)
        const options = []
        for (let y = to; y >= from; y -= 1) {
            options.push({ label: String(y), value: String(y) })
        }
        return options
    }, [minYear, year, currentYear])

    const monthOptions = useMemo(
        () =>
            generateFixedPeriods({
                periodType: 'MONTHLY',
                calendar: 'iso8601',
                year,
            }).map((period) => ({ label: period.name, value: period.endDate })),
        [year]
    )

    if (granularity === 'day') {
        return (
            <CalendarInput
                label={i18n.t('Last date')}
                placeholder={i18n.t('Latest available')}
                calendar="gregory"
                format="YYYY-MM-DD"
                clearable
                date={value}
                onDateSelect={(selected) =>
                    field.onChange(selected?.calendarDateString || undefined)
                }
                onBlur={field.onBlur}
                error={Boolean(fieldState.error)}
                validationText={fieldState.error?.message}
            />
        )
    }

    if (granularity === 'year') {
        return (
            <Field
                label={i18n.t('Last year')}
                validationText={fieldState.error?.message}
                error={Boolean(fieldState.error)}
            >
                <SingleSelectControl
                    name="handlerConfig.end.year"
                    value={stored ? String(stored.year) : ''}
                    placeholder={i18n.t('Latest available')}
                    options={yearOptions}
                    clearable
                    clearText={i18n.t('Clear')}
                    onChange={(next) =>
                        field.onChange(next ? `${next}-12-31` : undefined)
                    }
                />
            </Field>
        )
    }

    return (
        <Field
            label={i18n.t('Last month')}
            helpText={i18n.t(
                'Datasets sync through the end of the chosen month.'
            )}
            validationText={fieldState.error?.message}
            error={Boolean(fieldState.error)}
        >
            <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                    <SingleSelectControl
                        name="handlerConfig.end.month"
                        value={
                            stored
                                ? monthEndDate(stored.year, stored.month)
                                : ''
                        }
                        placeholder={i18n.t('Latest available')}
                        options={monthOptions}
                        clearable
                        clearText={i18n.t('Clear')}
                        onChange={(next) => field.onChange(next || undefined)}
                    />
                </div>
                <SingleSelectControl
                    name="handlerConfig.end.yearFilter"
                    value={String(year)}
                    options={yearOptions}
                    onChange={(next) => {
                        const nextYear = Number.parseInt(next, 10)
                        if (Number.isNaN(nextYear)) {
                            return
                        }
                        setPickedYear(nextYear)
                        if (stored) {
                            field.onChange(monthEndDate(nextYear, stored.month))
                        }
                    }}
                />
            </div>
        </Field>
    )
}
