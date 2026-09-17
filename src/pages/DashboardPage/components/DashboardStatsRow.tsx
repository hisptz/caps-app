import i18n from '@dhis2/d2-i18n'
import { IconSync16, IconUser16 } from '@dhis2/ui'
import React from 'react'
import classes from '../DashboardPage.module.css'
import statusGlyphStyles from '@/shared/components/ui/StatusTag/StatusTag.module.css'

type Props = {
    last24h: {
        total: number
        completed: number
        failed: number
        running: number
        awaitingStep: number
    }
}

export function DashboardStatsRow({ last24h }: Props): React.ReactElement {
    return (
        <div className={classes.statsRow}>
            <div className={classes.statCard}>
                <div className={classes.statValue}>{last24h.total}</div>
                <div className={classes.statLabel}>
                    {i18n.t('Total Runs (24h)')}
                </div>
            </div>
            <div className={`${classes.statCard} ${classes.statCardSuccess}`}>
                <div className={classes.statValue}>{last24h.completed}</div>
                <div className={classes.statLabel}>{i18n.t('Completed')}</div>
            </div>
            <div className={`${classes.statCard} ${classes.statCardError}`}>
                <div className={classes.statValue}>{last24h.failed}</div>
                <div className={classes.statLabel}>{i18n.t('Failed')}</div>
            </div>
            <div className={`${classes.statCard} ${classes.statCardRunning}`}>
                <div className={classes.statValueRow}>
                    {last24h.running + last24h.awaitingStep > 0 && (
                        <span className={classes.statGlyphs} aria-hidden>
                            {last24h.running > 0 && (
                                <span
                                    className={`${statusGlyphStyles.icon16} ${statusGlyphStyles.spin}`}
                                >
                                    <IconSync16 />
                                </span>
                            )}
                            {last24h.awaitingStep > 0 && (
                                <span
                                    className={`${statusGlyphStyles.icon16} ${statusGlyphStyles.wiggle}`}
                                >
                                    <IconUser16 />
                                </span>
                            )}
                        </span>
                    )}
                    <div className={classes.statValue}>
                        {last24h.running + last24h.awaitingStep}
                    </div>
                </div>
                <div className={classes.statLabel}>
                    {i18n.t('Running / Awaiting')}
                </div>
            </div>
        </div>
    )
}
