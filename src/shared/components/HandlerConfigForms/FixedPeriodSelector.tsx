import { generateFixedPeriods } from '@dhis2/multi-calendar-dates'
import { SimpleSingleSelectField } from '@dhis2/ui'
import { isEmpty } from 'lodash-es'
import React, { useMemo, useState } from 'react'
import { useController, useWatch } from 'react-hook-form'

export function FixedPeriodSelector({
    periodTypeKey,
    name,
    label,
}: {
    periodTypeKey: string
    name: string
    label: string
}) {
    const [year, setYear] = useState(new Date().getFullYear())
    const periodType = useWatch({
        name: periodTypeKey,
    })
    const { field, fieldState } = useController({
        name,
    })
    const options = useMemo(() => {
        if (!periodType) {
            return []
        }
        return generateFixedPeriods({
            periodType: periodType.toUpperCase(),
            calendar: 'iso8601',
            year,
        }).map((period) => ({ label: period.name, value: period.id }))
    }, [periodType, year])

    const years = useMemo(() => {
        return Array(10)
            .fill('')
            .map((_, i) => {
                const year = new Date().getFullYear() - i
                return { label: year.toString(), value: year.toString() }
            })
    }, [])

    if (!periodType) {
        return null
    }

    return (
        <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
                <SimpleSingleSelectField
                    className="flex-1"
                    value={!isEmpty(options) ? field.value : undefined}
                    error={!!fieldState.error?.message}
                    validationText={fieldState.error?.message}
                    label={label}
                    name={name}
                    options={options}
                    onChange={field.onChange}
                />
            </div>
            <SimpleSingleSelectField
                name="year"
                options={years}
                value={year.toString()}
                onChange={(e) => setYear(Number(e))}
                label="Year"
            />
        </div>
    )
}
