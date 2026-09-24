import i18n from '@dhis2/d2-i18n'
import { Button, NoticeBox } from '@dhis2/ui'
import React from 'react'
import { useModelingAppUrl } from '@/shared/hooks/useModelingAppUrl'

export interface ChapSetupNoticeProps {
    title: string
    message: string
    warning?: boolean
    onRefresh: () => void
}

export function ChapSetupNotice({
    title,
    message,
    warning,
    onRefresh,
}: ChapSetupNoticeProps): React.ReactElement {
    const url = useModelingAppUrl()

    return (
        <NoticeBox title={title} warning={warning}>
            <p style={{ marginTop: 0 }}>
                {message}
                {!url && (
                    <>
                        {' '}
                        {i18n.t(
                            'The CHAP Modeling app is not installed on this instance; ask an administrator to install it.'
                        )}
                    </>
                )}
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
                {url && (
                    <Button
                        small
                        onClick={() => window.open(url, '_blank', 'noopener')}
                    >
                        {i18n.t('Open Modeling app')}
                    </Button>
                )}
                <Button small secondary onClick={onRefresh}>
                    {i18n.t('Refresh')}
                </Button>
            </div>
        </NoticeBox>
    )
}
