import i18n from '@dhis2/d2-i18n'
import { InputField } from '@dhis2/ui'
import React, { useMemo } from 'react'
import { Controller, useWatch } from 'react-hook-form'
import classes from './ScheduleModal.module.css'
import {
    describeCron,
    getLocalTimezone,
    nextCronRuns,
    splitCronExpression,
} from '@/modules/pipeline-detail/utils/cronHelpers'

const CRON_PRESETS: ReadonlyArray<{ label: string; cron: string }> = [
    { label: i18n.t('Every hour'), cron: '0 * * * *' },
    { label: i18n.t('Daily 02:00'), cron: '0 2 * * *' },
    { label: i18n.t('Weekly Mon'), cron: '0 2 * * 1' },
    { label: i18n.t('Monthly 1st'), cron: '0 2 1 * *' },
]

const CHUNK_LABELS = [
    i18n.t('Minute'),
    i18n.t('Hour'),
    i18n.t('Day'),
    i18n.t('Month'),
    i18n.t('Weekday'),
]

export function CronPanel(): React.ReactElement {
    const tz = getLocalTimezone()
    const cron = (useWatch({ name: 'cronExpression' }) as string) ?? ''
    const chunks = useMemo(() => splitCronExpression(cron), [cron])
    const readsAs = useMemo(() => describeCron(cron, tz), [cron, tz])
    const nextRuns = useMemo(() => nextCronRuns(cron, tz, 3), [cron, tz])

    return (
        <div className={classes.cronCard}>
            <Controller
                name="cronExpression"
                render={({ field, fieldState }) => (
                    <InputField
                        label={i18n.t('Cron expression')}
                        required
                        placeholder="0 2 * * *"
                        value={field.value ?? ''}
                        onChange={({ value }) => field.onChange(value ?? '')}
                        onBlur={field.onBlur}
                        error={Boolean(fieldState.error) || !chunks.valid}
                        validationText={
                            fieldState.error?.message ??
                            (chunks.valid
                                ? undefined
                                : i18n.t('Expected 5 fields.'))
                        }
                    />
                )}
            />
            <div className={classes.chunkGrid} aria-hidden>
                {CHUNK_LABELS.map((label, i) => (
                    <div
                        key={label}
                        className={[
                            classes.chunk,
                            chunks.valid ? '' : classes.invalid,
                        ]
                            .filter(Boolean)
                            .join(' ')}
                    >
                        <div className={classes.chunkLabel}>{label}</div>
                        <div className={classes.chunkValue}>
                            {chunks.fields[i] ?? '—'}
                        </div>
                    </div>
                ))}
            </div>
            <CronPresets />
            <div className={classes.readout}>
                <div>
                    <div className={classes.readoutLabel}>
                        {i18n.t('Reads as')}
                    </div>
                    <div className={classes.readoutValue}>{readsAs}</div>
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
                                    {r.relative} ·{' '}
                                    <span className={classes.mono}>
                                        {r.local}
                                    </span>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            </div>
        </div>
    )
}

function CronPresets(): React.ReactElement {
    return (
        <Controller
            name="cronExpression"
            render={({ field }) => (
                <div className={classes.presets}>
                    <span className={classes.presetsLabel}>
                        {i18n.t('Presets')}:
                    </span>
                    {CRON_PRESETS.map((p) => {
                        const active = p.cron === field.value
                        return (
                            <button
                                key={p.cron}
                                type="button"
                                className={[
                                    classes.preset,
                                    active ? classes.active : '',
                                ]
                                    .filter(Boolean)
                                    .join(' ')}
                                onClick={() => field.onChange(p.cron)}
                            >
                                {p.label}
                            </button>
                        )
                    })}
                </div>
            )}
        />
    )
}
