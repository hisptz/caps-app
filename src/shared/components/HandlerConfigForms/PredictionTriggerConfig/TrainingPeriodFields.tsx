import i18n from '@dhis2/d2-i18n'
import { generateFixedPeriods } from '@dhis2/multi-calendar-dates'
import { InputField, SimpleSingleSelectField } from '@dhis2/ui'
import React, { useMemo, useState } from 'react'
import { useController } from 'react-hook-form'
import { get, set } from '../configHelpers'
import {
    lastCompletePeriodId,
    periodIdAtOffset,
} from '@/shared/components/HandlerConfigForms/PredictionTriggerConfig/periodIds'
import { formSectionGrids } from '@/shared/components/ui/FormPrimitives'
import type { PredictionSetup } from '@/shared/types/caps'

export interface TrainingPeriodFieldsProps {
    setup: PredictionSetup
    name?: string
    rolling?: boolean
}

/** Offset of the latest complete period: 1 = the one before the current period. */
const LATEST_OFFSET = 1
const YEARS_BACK = 10
type Dhis2PeriodType = Parameters<typeof generateFixedPeriods>[0]['periodType']

function dhis2PeriodType(periodType: string | null): Dhis2PeriodType {
    return periodType === 'week' ? 'WEEKLY' : 'MONTHLY'
}

/** Today as `YYYY-MM-DD` in local time, comparable with a period's `endDate`. */
function todayIso(): string {
    const now = new Date()
    return [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, '0'),
        String(now.getDate()).padStart(2, '0'),
    ].join('-')
}

function periodOptions(periodType: string | null, year: number) {
    const today = todayIso()
    return generateFixedPeriods({
        periodType: dhis2PeriodType(periodType),
        calendar: 'iso8601',
        year,
    })
        .filter((period) => period.endDate < today)
        .map((period) => ({ label: period.name, value: period.id }))
        .reverse()
}

function usePeriodName(
    periodId: string | null,
    periodType: string | null
): string {
    return useMemo(() => {
        if (!periodId) {
            return ''
        }
        const year = Number(periodId.slice(0, 4))
        if (!Number.isFinite(year)) {
            return periodId
        }
        const match = generateFixedPeriods({
            periodType: dhis2PeriodType(periodType),
            calendar: 'iso8601',
            year,
        }).find((period) => period.id === periodId)
        return match?.name ?? periodId
    }, [periodId, periodType])
}

export function TrainingPeriodFields({
    setup,
    name = 'handlerConfig.period',
    rolling = false,
}: TrainingPeriodFieldsProps): React.ReactElement {
    const { field, fieldState } = useController({ name })
    const latestId = lastCompletePeriodId(setup.periodType)
    const latestYear = Number(latestId.slice(0, 4))
    const period = (field.value ?? null) as Record<string, unknown> | null
    const periodOffset = period?.periodOffset
    const isRelative = rolling && typeof periodOffset === 'number'
    const endPeriod: string = isRelative
        ? periodIdAtOffset(setup.periodType, periodOffset)
        : get(field.value, 'endPeriod')
    const [year, setYear] = useState(() => {
        const stored = Number(endPeriod.slice(0, 4))
        return stored > 0 ? Math.min(stored, latestYear) : latestYear
    })

    const fromName = usePeriodName(setup.startPeriod, setup.periodType)
    const latestName = usePeriodName(latestId, setup.periodType)
    const endName = usePeriodName(endPeriod || null, setup.periodType)
    const options = useMemo(() => {
        const periods = periodOptions(setup.periodType, year)
        if (!rolling) {
            return periods
        }
        return periods.map((option) =>
            option.value === latestId
                ? {
                      ...option,
                      label: i18n.t('{{period}} (latest)', {
                          period: option.label,
                      }),
                  }
                : option
        )
    }, [setup.periodType, year, rolling, latestId])
    const years = useMemo(
        () =>
            Array.from({ length: YEARS_BACK }, (_, index) => {
                const value = latestYear - index
                return { label: String(value), value: String(value) }
            }),
        [latestYear]
    )

    function handleEndChange(selected: string): void {
        if (!rolling) {
            field.onChange(set(field.value, 'endPeriod', selected))
            return
        }
        const numberOfPeriodsToGenerate = period?.numberOfPeriodsToGenerate
        field.onChange(
            selected === latestId
                ? { periodOffset: LATEST_OFFSET, numberOfPeriodsToGenerate }
                : { endPeriod: selected, numberOfPeriodsToGenerate }
        )
    }

    let endHelpText = i18n.t('Last period of the training data.')
    if (rolling) {
        endHelpText = isRelative
            ? i18n.t(
                  'Moves with each run. A run today trains up to {{period}}.',
                  { period: endName }
              )
            : i18n.t(
                  'Every run trains up to this period. Pick {{latest}} to move forward with each run.',
                  { latest: latestName }
              )
    }

    return (
        <>
            <div className={formSectionGrids.grid2}>
                <InputField
                    label={i18n.t('From')}
                    helpText={i18n.t('First period of the training data.')}
                    value={fromName}
                    disabled
                    onChange={() => undefined}
                />
                <div
                    style={{
                        display: 'flex',
                        gap: 8,
                        alignItems: 'flex-start',
                    }}
                >
                    <div style={{ width: 96 }}>
                        <SimpleSingleSelectField
                            label={i18n.t('Year')}
                            name="trainingPeriodYear"
                            value={String(year)}
                            options={years}
                            onChange={(selected: string) =>
                                setYear(Number(selected))
                            }
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <SimpleSingleSelectField
                            label={i18n.t('To')}
                            required
                            name="trainingPeriodEnd"
                            value={endPeriod || undefined}
                            options={options}
                            error={!!fieldState.error}
                            helpText={endHelpText}
                            onChange={handleEndChange}
                        />
                    </div>
                </div>
            </div>
            <div className={formSectionGrids.grid2}>
                <InputField
                    label={i18n.t('Number of periods to generate')}
                    type="number"
                    min="1"
                    required
                    helpText={i18n.t('Forecast horizon.')}
                    value={get(field.value, 'numberOfPeriodsToGenerate')}
                    onChange={({ value: v }) =>
                        field.onChange(
                            set(
                                field.value,
                                'numberOfPeriodsToGenerate',
                                Number(v)
                            )
                        )
                    }
                />
            </div>
        </>
    )
}
