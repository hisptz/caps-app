import i18n from '@dhis2/d2-i18n'
import React from 'react'
import classes from './SettingsPage.module.css'

type Props = {
    currentUrl: string
}

export function ConnectionDiagram({ currentUrl }: Props): React.ReactElement {
    return (
        <div className={classes.diagram} aria-hidden>
            <div className={classes.endpoint}>
                <span className={classes.endpointBadge}>D2</span>
                <div className={classes.endpointText}>
                    <div className={classes.endpointName}>
                        {i18n.t('DHIS2 instance')}
                    </div>
                    <div className={classes.endpointPath}>
                        api/routes/caps/run
                    </div>
                </div>
            </div>
            <div className={`${classes.wire} ${classes.ok}`}>
                <span className={classes.wireBadge}>
                    {i18n.t('proxies to')}
                </span>
            </div>
            <div className={`${classes.endpoint} ${classes.right}`}>
                <div className={classes.endpointText}>
                    <div className={classes.endpointName}>
                        {i18n.t('CAPS service')}
                    </div>
                    <div className={classes.endpointPath}>
                        {currentUrl || '—'}
                    </div>
                </div>
                <span className={`${classes.endpointBadge} ${classes.teal}`}>
                    CAPS
                </span>
            </div>
        </div>
    )
}
