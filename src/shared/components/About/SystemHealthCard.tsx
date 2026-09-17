import i18n from '@dhis2/d2-i18n'
import { IconClock16 } from '@dhis2/ui'
import * as React from 'react'
import classes from './About.module.css'
import { ConnectedBadge } from './ConnectedBadge'

export type SystemHealthCardAccent = 'blue' | 'green' | 'orange'

export interface SystemHealthCardProps {
    id: string
    title: string
    description: string
    initial: string
    accent: SystemHealthCardAccent
    connected: boolean
    rows: { label: string; value: string }[]
    checkedLabel: string
    /** Aggregate fetch latency shown on connected cards; omitted when disconnected. */
    latencyMs?: number
}

export const SystemHealthCard: React.FC<SystemHealthCardProps> = ({
    id,
    title,
    description,
    initial,
    accent,
    connected,
    rows,
    checkedLabel,
    latencyMs,
}) => {
    const avatarClass = `${classes.systemAvatar} ${classes[`systemAvatar_${accent}`]}`

    return (
        <article className={classes.systemCard} aria-labelledby={`${id}-title`}>
            <header className={classes.systemCardHeaderBlock}>
                <div className={classes.systemCardHeaderMain}>
                    <div className={avatarClass} aria-hidden>
                        {initial}
                    </div>
                    <div className={classes.systemCardHeaderText}>
                        <div className={classes.systemCardTitleRow}>
                            <h4
                                id={`${id}-title`}
                                className={classes.systemCardTitle}
                            >
                                {title}
                            </h4>
                            <ConnectedBadge connected={connected} />
                        </div>
                        <p className={classes.systemCardDescription}>
                            {description}
                        </p>
                    </div>
                </div>
            </header>
            <div className={classes.systemCardBody}>
                {connected && rows.length > 0 ? (
                    <dl className={classes.infoRows}>
                        {rows.map(({ label, value }) => (
                            <React.Fragment key={label}>
                                <dt className={classes.infoLabel}>{label}</dt>
                                <dd className={classes.infoValue}>{value}</dd>
                            </React.Fragment>
                        ))}
                    </dl>
                ) : connected ? (
                    <p className={classes.systemMuted}>
                        {i18n.t('No additional details available.')}
                    </p>
                ) : (
                    <p className={classes.systemMuted}>
                        {i18n.t('Not connected')}
                    </p>
                )}
            </div>
            {connected && (
                <footer className={classes.systemCardFooter}>
                    <span className={classes.footerChecked}>
                        <IconClock16 />
                        {i18n.t('Last checked {{when}}', {
                            when: checkedLabel,
                        })}
                    </span>
                    {latencyMs !== undefined && (
                        <span
                            className={classes.footerLatency}
                            aria-label={i18n.t(
                                'Response time {{ms}} milliseconds',
                                {
                                    ms: latencyMs,
                                }
                            )}
                        >
                            {i18n.t('{{ms}} ms', { ms: latencyMs })}
                        </span>
                    )}
                </footer>
            )}
        </article>
    )
}
