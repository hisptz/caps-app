import i18n from '@dhis2/d2-i18n'
import type { ConcurrencyPolicy, LogLevel } from '@/shared/types/caps'

/** Tag styling for execution log / dead-letter level chips (matches @dhis2/ui Tag props). */
export function logLevelTagProps(level: string): {
    positive?: boolean
    negative?: boolean
    neutral?: boolean
} {
    if (level === 'ERROR') {
        return { negative: true }
    }
    if (level === 'WARN') {
        return { neutral: true }
    }
    if (level === 'INFO' || level === 'DEBUG') {
        return { neutral: true }
    }
    return {}
}

const logLevelLabels: Record<LogLevel, () => string> = {
    DEBUG: () => i18n.t('Debug'),
    INFO: () => i18n.t('Info'),
    WARN: () => i18n.t('Warn'),
    ERROR: () => i18n.t('Error'),
}

export function formatLogLevel(level: string): string {
    const fn = logLevelLabels[level as LogLevel]
    return fn ? fn() : level
}

const concurrencyLabels: Record<ConcurrencyPolicy, () => string> = {
    ALLOW: () => i18n.t('ALLOW — run in parallel'),
    SKIP: () => i18n.t('SKIP — skip if already running'),
    REPLACE: () => i18n.t('REPLACE — cancel old, start new'),
}

export function formatConcurrencyPolicy(policy: ConcurrencyPolicy): string {
    return concurrencyLabels[policy]?.() ?? policy
}

/**
 * Sync plan actions come straight from the Open Climate Service planner
 * (`no_op`, `append`, `rematerialize`, `not_syncable`). Raw, they read like
 */
const climateSyncActionLabels: Record<string, () => string> = {
    no_op: () => i18n.t('Already up to date - nothing to sync'),
    append: () => i18n.t('Add new periods'),
    rematerialize: () => i18n.t('Rebuild dataset with newer data'),
    not_syncable: () => i18n.t('Static dataset - cannot be synced'),
}

export function formatClimateSyncAction(action: string): string {
    return climateSyncActionLabels[action]?.() ?? titleCaseFromSnake(action)
}

export function climateSyncActionDoesWork(action: string | undefined): boolean {
    return action === 'append' || action === 'rematerialize'
}

/**
 * Human-readable label for values shown in StatusTag (execution, step, task, schedule status).
 * Uses the same msgids as execution filter dropdowns where applicable.
 */
const capsStatusLabels: Record<string, () => string> = {
    PENDING: () => i18n.t('Pending'),
    RUNNING: () => i18n.t('Running'),
    AWAITING_STEP: () => i18n.t('Awaiting Step'),
    COMPLETED: () => i18n.t('Completed'),
    FAILED: () => i18n.t('Failed'),
    CANCELLED: () => i18n.t('Cancelled'),
    PAUSED: () => i18n.t('Paused'),
    SUCCEEDED: () => i18n.t('Succeeded'),
    TIMED_OUT: () => i18n.t('Timed out'),
    SKIPPED: () => i18n.t('Skipped'),
    ACTIVE: () => i18n.t('Active'),
}

function titleCaseFromSnake(raw: string): string {
    return raw
        .split('_')
        .filter(Boolean)
        .map(
            (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join(' ')
}

export function formatCapsStatusLabel(status: string): string {
    const label = capsStatusLabels[status]
    if (label) {
        return label()
    }
    return titleCaseFromSnake(status)
}
