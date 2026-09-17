import i18n from '@dhis2/d2-i18n'
import * as React from 'react'
import classes from './About.module.css'
import { ConnectedSystemsSection } from './ConnectedSystemsSection'
import shellClasses from '@/shared/components/ui/PageShell/PageShell.module.css'

const AboutPage = () => {
    return (
        <div className={shellClasses.pageRoot}>
            <h2 className={classes.title}>{i18n.t('About CAPS')}</h2>
            <p className={classes.lead}>
                {i18n.t(
                    'Climate Automation & Prediction Scheduler (CAPS) is the operational face of the CAPS platform in DHIS2.'
                )}
            </p>
            <p className={classes.lead}>
                {i18n.t(
                    'CAPS provides an automation and scheduling layer for climate-informed disease prediction, connecting analytical and operational workflows inside DHIS2.'
                )}
            </p>
            <p className={classes.lead}>
                {i18n.t(
                    'This application is a pipeline operations console for monitoring scheduled jobs, executions, failures, analytics, and dead-letter events.'
                )}
            </p>
            <section className={classes.section}>
                <h3 className={classes.sectionTitle}>
                    {i18n.t('What you can do here')}
                </h3>
                <ul className={classes.list}>
                    <li>
                        {i18n.t(
                            'Review dashboards for run volume and stuck executions.'
                        )}
                    </li>
                    <li>
                        {i18n.t(
                            'Inspect pipelines, steps, schedules, and recent runs.'
                        )}
                    </li>
                    <li>
                        {i18n.t(
                            'Explore analytics for trends, top errors, and step durations.'
                        )}
                    </li>
                    <li>
                        {i18n.t(
                            'Drill into execution detail, logs, dead-letter events, and step-level outcomes.'
                        )}
                    </li>
                </ul>
            </section>
            <ConnectedSystemsSection />
        </div>
    )
}

export default AboutPage
