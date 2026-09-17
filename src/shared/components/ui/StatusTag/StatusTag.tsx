import { Tag } from '@dhis2/ui'
import React from 'react'
import { StatusGlyph } from './StatusGlyph'
import styles from './StatusTag.module.css'
import { formatCapsStatusLabel } from '@/shared/utils/label.utils'

interface StatusTagProps {
    status: string
}

const statusConfig: Record<
    string,
    { positive?: boolean; negative?: boolean; neutral?: boolean }
> = {
    COMPLETED: { positive: true },
    SUCCEEDED: { positive: true },
    ACTIVE: { positive: true },
    FAILED: { negative: true },
    TIMED_OUT: { negative: true },
    CANCELLED: { negative: true },
    RUNNING: { neutral: true },
    AWAITING_STEP: { neutral: true },
    PENDING: { neutral: true },
    PAUSED: { neutral: true },
    SKIPPED: { neutral: true },
}

export const StatusTag: React.FC<StatusTagProps> = ({ status }) => {
    const config = statusConfig[status] ?? {}
    return (
        <Tag
            positive={config.positive}
            negative={config.negative}
            neutral={config.neutral}
        >
            <span className={styles.tagContent}>
                <StatusGlyph status={status} />
                {formatCapsStatusLabel(status)}
            </span>
        </Tag>
    )
}
