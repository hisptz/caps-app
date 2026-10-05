import i18n from '@dhis2/d2-i18n'
import { InputField } from '@dhis2/ui'
import React from 'react'
import { Controller, useFormContext, useWatch } from 'react-hook-form'
import { ConfigLabeledControl } from '../ConfigLabeledControl'
import { FixedPeriodSelector } from '../FixedPeriodSelector'
import classes from './Dhis2InstancePullConfig.module.css'
import type {
    PullPeriod,
    PullPeriodType,
} from '@/modules/dhis2-instance-pull/schemas/config'
import { relativeWindow } from '@/modules/dhis2-instance-pull/utils/periods'
import {
    formSectionGrids,
    SegmentedControl,
} from '@/shared/components/ui/FormPrimitives'

type Mode = PullPeriod['mode']

const MODE_OPTIONS: Array<{ value: Mode; label: string }> = [
    { value: 'relative', label: i18n.t('Latest periods') },
    { value: 'fixed', label: i18n.t('Fixed range') },
]

const TYPE_OPTIONS: Array<{ value: PullPeriodType; label: string }> = [
    { value: 'MONTHLY', label: i18n.t('Monthly') },
    { value: 'WEEKLY', label: i18n.t('Weekly') },
]

function defaultPeriod(mode: Mode, periodType: PullPeriodType): PullPeriod {
    return mode === 'relative'
        ? { mode, periodType, count: 3, offset: 1 }
        : { mode, periodType, start: '', end: '' }
}

function NumberField({
    name,
    label,
    helpText,
    min,
}: {
    name: string
    label: string
    helpText: string
    min: number
}) {
    return (
        <Controller
            name={name}
            render={({ field, fieldState }) => (
                <InputField
                    label={label}
                    type="number"
                    min={String(min)}
                    inputWidth="120px"
                    helpText={helpText}
                    value={
                        Number.isFinite(field.value) ? String(field.value) : ''
                    }
                    onChange={({ value }) =>
                        field.onChange(value === '' ? undefined : Number(value))
                    }
                    onBlur={field.onBlur}
                    error={Boolean(fieldState.error)}
                    validationText={fieldState.error?.message}
                />
            )}
        />
    )
}

/**
 * Period fields for a pull: the latest N completed periods (for schedules) or a fixed range
 * (for backfills). `name` is the path of the period object, e.g. `handlerConfig.period`.
 */
export function PullPeriodFields({
    name,
    allowRelative = true,
}: {
    name: string
    allowRelative?: boolean
}): React.ReactElement {
    const { setValue } = useFormContext()
    const period = useWatch({ name }) as PullPeriod | undefined
    const mode: Mode = allowRelative ? (period?.mode ?? 'relative') : 'fixed'
    const periodType: PullPeriodType = period?.periodType ?? 'MONTHLY'
    const window = period ? relativeWindow(period) : null

    function reset(nextMode: Mode, nextType: PullPeriodType) {
        setValue(name, defaultPeriod(nextMode, nextType), {
            shouldDirty: true,
            shouldValidate: false,
        })
    }

    return (
        <>
            <div className={classes.inlineControls}>
                {allowRelative && (
                    <ConfigLabeledControl label={i18n.t('Periods to pull')}>
                        <SegmentedControl
                            name={`${name}-mode`}
                            value={mode}
                            options={MODE_OPTIONS}
                            onChange={(next) => reset(next, periodType)}
                            aria-label={i18n.t('Periods to pull')}
                        />
                    </ConfigLabeledControl>
                )}
                <ConfigLabeledControl label={i18n.t('Period type')}>
                    <SegmentedControl
                        name={`${name}-type`}
                        value={periodType}
                        options={TYPE_OPTIONS}
                        onChange={(next) => reset(mode, next)}
                        aria-label={i18n.t('Period type')}
                    />
                </ConfigLabeledControl>
            </div>

            {mode === 'relative' ? (
                <>
                    <div className={formSectionGrids.grid2}>
                        <NumberField
                            name={`${name}.count`}
                            label={i18n.t('Number of periods')}
                            min={1}
                            helpText={i18n.t(
                                'Pulled again on every run, so late reports in the source get corrected.'
                            )}
                        />
                        <NumberField
                            name={`${name}.offset`}
                            label={i18n.t('Skip most recent')}
                            min={0}
                            helpText={i18n.t(
                                '1 skips the current period, which isn’t finished yet.'
                            )}
                        />
                    </div>
                    {window && (
                        <p className={classes.hint}>
                            {window.first === window.last
                                ? i18n.t('A run today pulls {{first}}.', window)
                                : i18n.t(
                                      'A run today pulls {{first}} to {{last}}.',
                                      window
                                  )}
                        </p>
                    )}
                </>
            ) : (
                <div className={formSectionGrids.grid2}>
                    <FixedPeriodSelector
                        periodTypeKey={`${name}.periodType`}
                        name={`${name}.start`}
                        label={i18n.t('From')}
                    />
                    <FixedPeriodSelector
                        periodTypeKey={`${name}.periodType`}
                        name={`${name}.end`}
                        label={i18n.t('To')}
                    />
                </div>
            )}
        </>
    )
}
