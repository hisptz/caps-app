import i18n from '@dhis2/d2-i18n'
import { InputField, NoticeBox } from '@dhis2/ui'
import React from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import {
    type HandlerPeriodType,
    normalizeCoverageBound,
} from '../utils/climateDatasetPeriodUtils'
import {
    lastDayOfPeriod,
    MAX_ROLLING_COUNT,
    rollingFieldsOf,
    rollingPeriod,
    rollingWindow,
} from '../utils/climatePeriod'
import type { ClimateTemporalExtent } from '@/capsApi/types'

export const PERIOD_UNIT_LABEL: Record<HandlerPeriodType, string> = {
    daily: i18n.t('days'),
    weekly: i18n.t('weeks'),
    monthly: i18n.t('months'),
}

function parseWholeNumber(value: string | undefined): number | undefined {
    const parsed = Number.parseInt(value ?? '', 10)
    return Number.isNaN(parsed) ? undefined : parsed
}

/**
 * Count and offset of a rolling period at `name` (a step's `handlerConfig.period`, or a run or
 * schedule override's), with a preview of the dates a run today would cover.
 */
export function RollingPeriodFields({
    name,
    periodType,
    temporalExtent,
}: {
    name: string
    periodType: HandlerPeriodType
    temporalExtent: ClimateTemporalExtent | undefined
}): React.ReactElement {
    const { getFieldState, setValue, formState } = useFormContext()
    const period = useWatch({ name }) as Record<string, unknown> | undefined
    const { count, offset } = rollingFieldsOf(period)
    const unit = PERIOD_UNIT_LABEL[periodType]
    const countError =
        getFieldState(`${name}.count`, formState).error?.message ??
        getFieldState(`${name}.lastDays`, formState).error?.message
    const offsetError = getFieldState(`${name}.offset`, formState).error
        ?.message

    // Writing either field moves an earlier `lastDays` period to the rolling form.
    function update(next: { count?: number; offset?: number }): void {
        setValue(
            name,
            rollingPeriod(
                periodType,
                'count' in next ? next.count : count,
                'offset' in next ? (next.offset ?? 0) : offset
            ),
            { shouldDirty: true, shouldValidate: formState.isSubmitted }
        )
    }

    const window =
        count !== undefined && count >= 1 && offset >= 0
            ? rollingWindow({ periodType, count, offset })
            : undefined
    const lastStep = normalizeCoverageBound(temporalExtent?.end, 'end')
    const coverageEnd = lastStep && lastDayOfPeriod(lastStep, periodType)
    const beyondCoverage = window && coverageEnd && window[1] > coverageEnd

    return (
        <>
            <InputField
                label={i18n.t('Number of {{unit}}', { unit })}
                name={`${name}.count`}
                type="number"
                min="1"
                max={String(MAX_ROLLING_COUNT[periodType])}
                required
                value={count === undefined ? '' : String(count)}
                onChange={({ value }) =>
                    update({ count: parseWholeNumber(value) })
                }
                error={Boolean(countError)}
                validationText={countError}
                helpText={i18n.t('Covered on every run.', { unit })}
            />
            <InputField
                label={i18n.t('Skip the most recent {{unit}}', { unit })}
                name={`${name}.offset`}
                type="number"
                min="0"
                value={String(offset)}
                onChange={({ value }) =>
                    update({ offset: parseWholeNumber(value) })
                }
                error={Boolean(offsetError)}
                validationText={offsetError}
                helpText={i18n.t(
                    '1 stops at the last complete period. Raise it for sources that publish late.'
                )}
            />
            {window && (
                <div style={{ gridColumn: '1 / -1' }}>
                    <NoticeBox
                        warning={Boolean(beyondCoverage)}
                        title={i18n.t(
                            'A run today covers {{start}} – {{end}}',
                            {
                                start: window[0],
                                end: window[1],
                            }
                        )}
                    >
                        {beyondCoverage
                            ? i18n.t(
                                  'The dataset currently ends {{end}}. Later {{unit}} stay empty until it is synced; an Open Climate Service Sync step before this one keeps it current.',
                                  { end: coverageEnd, unit }
                              )
                            : i18n.t(
                                  'Worked out when each run starts (UTC), so a scheduled pipeline moves forward.'
                              )}
                    </NoticeBox>
                </div>
            )}
        </>
    )
}
