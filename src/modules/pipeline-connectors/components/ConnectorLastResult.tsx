import i18n from '@dhis2/d2-i18n'
import React from 'react'
import { Link } from 'react-router'
import classes from './ConnectorModal.module.css'
import { describeConnectorRunTime } from '@/modules/pipeline-connectors/utils/connectorLabels'
import { StatusTag } from '@/shared/components/ui/StatusTag'
import tableNavLinkClasses from '@/shared/components/ui/TableNavLink/TableNavLink.module.css'
import type { LatestConnectorRun } from '@/shared/types/caps'

export function ConnectorLastResult({
    run,
}: {
    run: LatestConnectorRun | undefined
}): React.ReactElement {
    if (!run) {
        return (
            <span className={classes.muted}>{i18n.t('Not checked yet')}</span>
        )
    }

    return (
        <div className={classes.result}>
            <div className={classes.resultLine}>
                <StatusTag status={run.status} />
                {run.targetExecution && (
                    <>
                        <span aria-hidden>→</span>
                        <Link
                            to={`/executions/${run.targetExecution.id}`}
                            className={tableNavLinkClasses.link}
                            aria-label={i18n.t('Open the run it started')}
                        >
                            <StatusTag status={run.targetExecution.status} />
                        </Link>
                    </>
                )}
            </div>
            <span className={classes.resultNote}>
                {run.startedOtherwise
                    ? i18n.t(
                          'Condition not met, so the otherwise pipeline started'
                      )
                    : run.status === 'WAITING' || !run.reason
                      ? describeConnectorRunTime(run)
                      : run.reason}
            </span>
        </div>
    )
}
