import i18n from '@dhis2/d2-i18n'
import {
    Chip,
    InputField,
    SegmentedControl,
    SingleSelectField,
    SingleSelectOption,
} from '@dhis2/ui'
import React, { useEffect, useMemo, useState } from 'react'
import { useController } from 'react-hook-form'
import classes from './ScheduleModal.module.css'
import {
    buildCron,
    describeScheduleInWords,
    formatTime,
    getLocalTimezone,
    nextCronRuns,
    parseSimpleSchedule,
    parseTime,
    scheduleOfKind,
    splitCronExpression,
    WEEK_ORDER,
    weekdayName,
    weekdayShortName,
    type ScheduleKind,
    type SimpleSchedule,
} from '@/modules/pipeline-detail/utils/cronHelpers'

type Mode = ScheduleKind | 'custom'

const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5)
const DAYS_OF_MONTH = Array.from({ length: 31 }, (_, i) => i + 1)

/**
 * Pick when something runs: every hour, day, week or month, or a cron expression. Every
 * choice is written to the form's `cronExpression` field as cron.
 */
export function CronPanel(): React.ReactElement {
    const { field, fieldState } = useController({ name: 'cronExpression' })
    const cron = (field.value as string | undefined) ?? ''
    const schedule = useMemo(() => parseSimpleSchedule(cron), [cron])
    // "Custom" stays chosen even when the expression happens to fit a simple shape
    const [customChosen, setCustomChosen] = useState(
        () => cron.trim() !== '' && parseSimpleSchedule(cron) === null
    )
    const mode: Mode = customChosen || !schedule ? 'custom' : schedule.kind

    // A new schedule starts as "every day at 06:00" rather than an empty cron box
    const { onChange } = field
    const empty = cron.trim() === ''
    useEffect(() => {
        if (empty && !customChosen) {
            onChange(buildCron({ kind: 'daily', hour: 6, minute: 0 }))
        }
    }, [empty, customChosen, onChange])

    const tz = getLocalTimezone()
    const valid = splitCronExpression(cron).valid
    const inWords = useMemo(() => describeScheduleInWords(cron), [cron])
    const nextRuns = useMemo(() => nextCronRuns(cron, tz, 3), [cron, tz])

    const write = (next: SimpleSchedule) => field.onChange(buildCron(next))

    const chooseMode = (next: Mode) => {
        if (next === 'custom') {
            setCustomChosen(true)
            return
        }
        setCustomChosen(false)
        write(scheduleOfKind(next, schedule))
    }

    const setTime = (value: string) => {
        const time = parseTime(value)
        if (time && schedule && schedule.kind !== 'hourly') {
            write({ ...schedule, ...time })
        }
    }

    const timeField = schedule && schedule.kind !== 'hourly' && (
        <InputField
            className={classes.timeField}
            label={i18n.t('At')}
            type="time"
            dense
            value={formatTime(schedule.hour, schedule.minute)}
            onChange={({ value }) => setTime(value ?? '')}
        />
    )

    return (
        <div className={classes.cronCard}>
            <div className={classes.repeats}>
                <span className={classes.fieldLabel} id="schedule-repeats">
                    {i18n.t('Repeats')}
                </span>
                <div aria-labelledby="schedule-repeats">
                    <SegmentedControl
                        selected={mode}
                        onChange={({ value }) => chooseMode(value as Mode)}
                        options={[
                            { value: 'hourly', label: i18n.t('Every hour') },
                            { value: 'daily', label: i18n.t('Every day') },
                            { value: 'weekly', label: i18n.t('Every week') },
                            { value: 'monthly', label: i18n.t('Every month') },
                            { value: 'custom', label: i18n.t('Custom') },
                        ]}
                    />
                </div>
            </div>

            {mode === 'hourly' && schedule?.kind === 'hourly' && (
                <SingleSelectField
                    className={classes.timeField}
                    label={i18n.t('Minutes past the hour')}
                    dense
                    selected={String(schedule.minute)}
                    onChange={({ selected }) =>
                        write({ kind: 'hourly', minute: Number(selected) })
                    }
                >
                    {[...new Set([...MINUTES, schedule.minute])]
                        .sort((a, b) => a - b)
                        .map((m) => (
                            <SingleSelectOption
                                key={m}
                                value={String(m)}
                                label={`:${String(m).padStart(2, '0')}`}
                            />
                        ))}
                </SingleSelectField>
            )}

            {mode === 'daily' && (
                <div className={classes.whenRow}>{timeField}</div>
            )}

            {mode === 'weekly' && schedule?.kind === 'weekly' && (
                <div className={classes.whenRow}>
                    <div>
                        <span className={classes.fieldLabel}>
                            {i18n.t('On')}
                        </span>
                        <div className={classes.weekdays}>
                            {WEEK_ORDER.map((day) => {
                                const on = schedule.days.includes(day)
                                // At least one day stays chosen
                                const last = on && schedule.days.length === 1
                                return (
                                    <Chip
                                        key={day}
                                        dense
                                        selected={on}
                                        disabled={last}
                                        onClick={() =>
                                            write({
                                                ...schedule,
                                                days: on
                                                    ? schedule.days.filter(
                                                          (d) => d !== day
                                                      )
                                                    : [...schedule.days, day],
                                            })
                                        }
                                    >
                                        <span title={weekdayName(day)}>
                                            {weekdayShortName(day)}
                                        </span>
                                    </Chip>
                                )
                            })}
                        </div>
                    </div>
                    {timeField}
                </div>
            )}

            {mode === 'monthly' && schedule?.kind === 'monthly' && (
                <div className={classes.whenRow}>
                    <SingleSelectField
                        className={classes.timeField}
                        label={i18n.t('On day')}
                        dense
                        selected={String(schedule.day)}
                        onChange={({ selected }) =>
                            write({ ...schedule, day: Number(selected) })
                        }
                    >
                        {DAYS_OF_MONTH.map((d) => (
                            <SingleSelectOption
                                key={d}
                                value={String(d)}
                                label={String(d)}
                            />
                        ))}
                    </SingleSelectField>
                    {timeField}
                </div>
            )}

            {mode === 'custom' && (
                <InputField
                    label={i18n.t('Cron expression')}
                    required
                    placeholder="0 6 * * 1"
                    inputWidth="280px"
                    value={cron}
                    onChange={({ value }) => field.onChange(value ?? '')}
                    onBlur={field.onBlur}
                    error={Boolean(fieldState.error) || (!valid && cron !== '')}
                    validationText={
                        fieldState.error?.message ??
                        (valid || cron === ''
                            ? undefined
                            : i18n.t(
                                  'Five fields: minute, hour, day of month, month, weekday.'
                              ))
                    }
                    helpText={i18n.t(
                        'Minute, hour, day of month, month, weekday. For example 0 6 * * 1 is Mondays at 06:00.'
                    )}
                />
            )}

            {mode !== 'custom' && fieldState.error?.message && (
                <p className={classes.fieldError}>{fieldState.error.message}</p>
            )}

            <div className={classes.readout}>
                <div>
                    <div className={classes.readoutLabel}>{i18n.t('Runs')}</div>
                    <div className={classes.readoutValue}>{inWords}</div>
                    {mode !== 'custom' && (
                        <div className={classes.cronEcho}>
                            {i18n.t('Cron: {{cron}}', {
                                cron,
                                nsSeparator: '~~',
                                interpolation: { escapeValue: false },
                            })}
                        </div>
                    )}
                </div>
                <div>
                    <div className={classes.readoutLabel}>
                        {i18n.t('Next 3 runs')}
                    </div>
                    <ul className={classes.runsList}>
                        {nextRuns.length === 0 ? (
                            <li>{i18n.t('—')}</li>
                        ) : (
                            nextRuns.map((r) => (
                                <li key={r.iso}>
                                    {r.local}{' '}
                                    <span className={classes.relative}>
                                        · {r.relative}
                                    </span>
                                </li>
                            ))
                        )}
                    </ul>
                    <div className={classes.cronEcho}>
                        {i18n.t('Shown in your time zone ({{tz}})', {
                            tz,
                            interpolation: { escapeValue: false },
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}
