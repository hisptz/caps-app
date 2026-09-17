import i18n from '@dhis2/d2-i18n'
import * as React from 'react'
import classes from './About.module.css'

export const ConnectedBadge: React.FC<{ connected: boolean }> = ({
    connected,
}) => (
    <span
        className={
            connected ? classes.connectedBadge : classes.disconnectedBadge
        }
    >
        <span className={classes.badgeDot} aria-hidden />
        {connected ? i18n.t('Connected') : i18n.t('Not connected')}
    </span>
)
