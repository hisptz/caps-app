import i18n from '@dhis2/d2-i18n'

/** The parts of a pull period a schedule looks at (fixed `start`/`end` or relative `count`/`offset`). */
export type PullPeriodLike = {
    mode?: string
    periodType?: string
    count?: number
    offset?: number
}

const DEFAULT_COUNT = 3
const DEFAULT_OFFSET = 1

/**
 * The latest-periods override a schedule starts with: the step's own when it pulls latest
 * periods, otherwise three completed periods of the step's type.
 */
export function schedulePullPeriod(
    stepPeriod: PullPeriodLike | undefined
): Record<string, unknown> {
    const periodType = stepPeriod?.periodType ?? 'MONTHLY'
    if (stepPeriod?.mode === 'relative') {
        return {
            mode: 'relative',
            periodType,
            count: stepPeriod.count ?? DEFAULT_COUNT,
            offset: stepPeriod.offset ?? DEFAULT_OFFSET,
        }
    }
    return {
        mode: 'relative',
        periodType,
        count: DEFAULT_COUNT,
        offset: DEFAULT_OFFSET,
    }
}

/**
 * A schedule pulls the step's periods (no override) or latest periods; a fixed range would
 * pull the same periods on every scheduled run.
 */
export function schedulePullPeriodIssue(
    context: Record<string, unknown>
): { path: string[]; message: string } | null {
    const period = context.period as PullPeriodLike | undefined
    if (period === undefined || period.mode === 'relative') {
        return null
    }
    return {
        path: ['period', 'mode'],
        message: i18n.t(
            'Scheduled runs pull the step’s periods or latest periods, not a fixed range'
        ),
    }
}
