import i18n from '@dhis2/d2-i18n'
import { InputField } from '@dhis2/ui'
import React from 'react'
import { Controller, useFormContext, useWatch } from 'react-hook-form'
import { ConfigLabeledControl } from '../ConfigLabeledControl'
import { PullPeriodFields } from '../Dhis2InstancePullConfig/PullPeriodFields'
import type { PullPeriodType } from '@/modules/dhis2-instance-pull/schemas/config'
import type { PushPeriod } from '@/modules/dhis2-instance-push/schemas/config'
import { SegmentedControl } from '@/shared/components/ui/FormPrimitives'

type Mode = PushPeriod['mode']

const MODE_OPTIONS: Array<{ value: Mode; label: string }> = [
    { value: 'updated', label: i18n.t('Recently updated') },
    { value: 'relative', label: i18n.t('Latest periods') },
    { value: 'fixed', label: i18n.t('Fixed range') },
]

function defaultPeriod(mode: Mode, periodType: PullPeriodType): PushPeriod {
    switch (mode) {
        case 'updated':
            return { mode, days: 7 }
        case 'relative':
            return { mode, periodType, count: 3, offset: 1 }
        case 'fixed':
            return { mode, periodType, start: '', end: '' }
    }
}

/**
 * Which staging values a push reads: those updated in the last N days (for schedules; it
 * catches predictions and thresholds for future periods too), or a range of periods (for
 * backfills). `name` is the path of the period object, e.g. `handlerConfig.period`.
 */
export function PushPeriodFields({
    name,
    allowFixed = true,
    allowUpdated = true,
}: {
    name: string
    /** Off when reading analytics, which can't be filtered by last update. */
    allowUpdated?: boolean
    /** Off for schedules, where every run would push the same fixed range. */
    allowFixed?: boolean
}): React.ReactElement {
    const { setValue } = useFormContext()
    const period = useWatch({ name }) as PushPeriod | undefined
    const mode: Mode = period?.mode ?? 'updated'
    const periodType: PullPeriodType =
        period && period.mode !== 'updated' ? period.periodType : 'MONTHLY'

    return (
        <>
            <ConfigLabeledControl label={i18n.t('Values to push')}>
                <SegmentedControl<Mode>
                    name={`${name}-push-mode`}
                    value={mode}
                    options={MODE_OPTIONS.filter(
                        (o) =>
                            (allowFixed || o.value !== 'fixed') &&
                            (allowUpdated || o.value !== 'updated')
                    )}
                    onChange={(next) =>
                        setValue(name, defaultPeriod(next, periodType), {
                            shouldDirty: true,
                            shouldValidate: false,
                        })
                    }
                    aria-label={i18n.t('Values to push')}
                />
            </ConfigLabeledControl>
            {mode === 'updated' ? (
                <Controller
                    name={`${name}.days`}
                    render={({ field, fieldState }) => (
                        <InputField
                            label={i18n.t('Updated in the last (days)')}
                            type="number"
                            min="1"
                            max="366"
                            inputWidth="120px"
                            helpText={i18n.t(
                                'Every value stored or changed on staging in this time is sent, whatever its period. Make it at least as long as the time between runs.'
                            )}
                            value={
                                Number.isFinite(field.value)
                                    ? String(field.value)
                                    : ''
                            }
                            onChange={({ value }) =>
                                field.onChange(
                                    value === '' ? undefined : Number(value)
                                )
                            }
                            onBlur={field.onBlur}
                            error={Boolean(fieldState.error)}
                            validationText={fieldState.error?.message}
                        />
                    )}
                />
            ) : (
                <PullPeriodFields name={name} lockedMode={mode} />
            )}
        </>
    )
}
