import i18n from '@dhis2/d2-i18n'
import { Button, ButtonStrip, NoticeBox } from '@dhis2/ui'
import React from 'react'
import classes from './ClimateJobProgressBanner.module.css'
import type { ClimateJobRecord } from '@/capsApi/types'
import { isActiveJobStatus } from '@/modules/climate-data/hooks/useClimateJobPolling'

type Props = {
    job: ClimateJobRecord | undefined
    loading?: boolean
    datasetLabel?: string | null
    onCancel?: () => void
    onDismiss?: () => void
    cancelPending?: boolean
}

function resolvePercent(job: ClimateJobRecord): number | null {
    const { percent, done, total } = job.progress ?? {}
    if (typeof percent === 'number' && Number.isFinite(percent)) {
        return Math.min(100, Math.max(0, percent))
    }
    if (
        typeof done === 'number' &&
        typeof total === 'number' &&
        Number.isFinite(done) &&
        Number.isFinite(total) &&
        total > 0
    ) {
        return Math.min(100, Math.max(0, (done / total) * 100))
    }
    return null
}

function statusLabel(status: ClimateJobRecord['status']): string {
    if (status === 'accepted') {
        return i18n.t('Queued')
    }
    if (status === 'retrying') {
        return i18n.t('Retrying')
    }
    return i18n.t('Running')
}

function ProgressReadout({
    job,
    action,
}: {
    job: ClimateJobRecord
    action?: React.ReactNode
}): React.ReactElement {
    const percent = resolvePercent(job)
    const { done, total, message } = job.progress ?? {}
    const stage = message ?? statusLabel(job.status)

    return (
        <>
            <p className={classes.stage}>{stage}</p>
            <div className={classes.progressRow}>
                <div
                    className={classes.track}
                    role="progressbar"
                    aria-label={i18n.t('Job progress')}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={
                        percent != null ? Math.round(percent) : undefined
                    }
                    aria-valuetext={percent == null ? stage : undefined}
                >
                    <div
                        className={
                            percent == null
                                ? `${classes.fill} ${classes.indeterminate}`
                                : classes.fill
                        }
                        style={
                            percent == null
                                ? undefined
                                : { width: `${percent}%` }
                        }
                    />
                </div>
                {action}
            </div>
            <div className={classes.meta}>
                <span>{statusLabel(job.status)}</span>
                <span className={classes.counts}>
                    {percent != null
                        ? `${Math.round(percent)}%`
                        : i18n.t('Estimating…')}
                    {typeof done === 'number' && typeof total === 'number'
                        ? ` · ${done}/${total}`
                        : ''}
                </span>
            </div>
        </>
    )
}

export function ClimateJobProgressBanner({
    job,
    loading = false,
    datasetLabel,
    onCancel,
    onDismiss,
    cancelPending = false,
}: Props): React.ReactElement | null {
    const title = datasetLabel
        ? i18n.t('Climate job · {{dataset}}', { dataset: datasetLabel })
        : i18n.t('Climate job')

    if (!job) {
        if (!loading) {
            return null
        }
        return (
            <div className={classes.card}>
                <NoticeBox title={title}>
                    <div className={classes.body} aria-live="polite">
                        <p className={classes.stage}>
                            {i18n.t('Checking job status…')}
                        </p>
                        <div className={classes.track}>
                            <div
                                className={`${classes.fill} ${classes.indeterminate}`}
                            />
                        </div>
                    </div>
                </NoticeBox>
            </div>
        )
    }

    const dismissAction = onDismiss ? (
        <ButtonStrip className={classes.actions}>
            <Button small secondary onClick={onDismiss}>
                {i18n.t('Dismiss')}
            </Button>
        </ButtonStrip>
    ) : null

    if (job.status === 'successful') {
        return (
            <div className={classes.card}>
                <NoticeBox valid title={title}>
                    <div className={classes.body} aria-live="polite">
                        <p className={classes.stage}>
                            {job.progress?.message ??
                                i18n.t('Finished successfully.')}
                        </p>
                    </div>
                </NoticeBox>
            </div>
        )
    }

    if (job.status === 'failed') {
        return (
            <div className={classes.card}>
                <NoticeBox error title={title}>
                    <div className={classes.body} aria-live="polite">
                        <p className={classes.stage}>
                            {job.error?.message ??
                                i18n.t(
                                    'The dataset operation failed. Try again.'
                                )}
                        </p>
                        {dismissAction}
                    </div>
                </NoticeBox>
            </div>
        )
    }

    if (job.status === 'cancelled') {
        return (
            <div className={classes.card}>
                <NoticeBox warning title={title}>
                    <div className={classes.body} aria-live="polite">
                        <p className={classes.stage}>
                            {i18n.t('The dataset operation was cancelled.')}
                        </p>
                        {dismissAction}
                    </div>
                </NoticeBox>
            </div>
        )
    }

    const cancelAction =
        onCancel && isActiveJobStatus(job.status) ? (
            <Button
                small
                secondary
                loading={cancelPending}
                disabled={cancelPending || job.cancelRequested}
                onClick={onCancel}
            >
                {job.cancelRequested ? i18n.t('Cancelling…') : i18n.t('Cancel')}
            </Button>
        ) : null

    return (
        <div className={classes.card}>
            <NoticeBox title={title}>
                <div className={classes.body} aria-live="polite">
                    <ProgressReadout job={job} action={cancelAction} />
                </div>
            </NoticeBox>
        </div>
    )
}
