import i18n from '@dhis2/d2-i18n'
import { Button, NoticeBox } from '@dhis2/ui'
import React from 'react'
import classes from '../ExecutionDetailPage.module.css'
import type { ExecutionError } from '@/shared/types/caps'

type Props = {
    title: string
    error: ExecutionError
    onViewDetails: () => void
}

/** One-line failure headline; the full context lives in ErrorDetailsModal. */
export function ErrorNotice({
    title,
    error,
    onViewDetails,
}: Props): React.ReactElement {
    const details = error.errorDetails
    const totalConflicts =
        details?.totalConflicts ??
        details?.conflicts?.reduce((n, c) => n + c.count, 0)
    const hasMore = Boolean(details || error.errorStack)

    return (
        <NoticeBox error title={title}>
            <div className={classes.errorNoticeBody}>
                <span className={classes.errorNoticeMessage}>
                    {error.errorMessage}
                    {totalConflicts ? (
                        <span className={classes.errorNoticeCount}>
                            {i18n.t('{{n}} conflicts', {
                                n: String(totalConflicts),
                            })}
                        </span>
                    ) : null}
                </span>
                {hasMore && (
                    <Button small secondary onClick={onViewDetails}>
                        {i18n.t('View details')}
                    </Button>
                )}
            </div>
        </NoticeBox>
    )
}
