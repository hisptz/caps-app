import i18n from '@dhis2/d2-i18n'
import React from 'react'
import { Link } from 'react-router'
import classes from './ConnectorModal.module.css'
import tableNavLinkClasses from '@/shared/components/ui/TableNavLink/TableNavLink.module.css'

type PipelineLinkRef = { id: string; name?: string }

/** The pipeline a connector starts, with its otherwise pipeline (if any) underneath. */
export function ConnectorTargets({
    target,
    otherwise,
}: {
    target: PipelineLinkRef
    otherwise?: PipelineLinkRef | null
}): React.ReactElement {
    return (
        <div className={classes.result}>
            <Link
                to={`/pipelines/${target.id}`}
                className={tableNavLinkClasses.link}
            >
                {target.name ?? target.id}
            </Link>
            {otherwise && (
                <span className={classes.resultNote}>
                    {i18n.t('Otherwise')} →{' '}
                    <Link
                        to={`/pipelines/${otherwise.id}`}
                        className={tableNavLinkClasses.link}
                    >
                        {otherwise.name ?? otherwise.id}
                    </Link>
                </span>
            )}
        </div>
    )
}
