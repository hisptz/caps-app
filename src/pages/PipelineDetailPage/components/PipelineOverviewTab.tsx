import i18n from '@dhis2/d2-i18n'
import { Tag } from '@dhis2/ui'
import React from 'react'
import classes from '../PipelineDetailPage.module.css'
import type { PipelineDetailResponse } from '@/capsApi/types'
import { formatDate } from '@/modules/pipeline-detail/utils/formatLabels'
import { formatConcurrencyPolicy } from '@/shared/utils/label.utils'

type Props = {
    pipeline: PipelineDetailResponse
}

export function PipelineOverviewTab({ pipeline }: Props): React.ReactElement {
    return (
        <dl className={classes.infoGrid}>
            <div className={classes.infoRow}>
                <dt>{i18n.t('Status')}</dt>
                <dd>
                    {pipeline.isActive ? (
                        <Tag positive>{i18n.t('Active')}</Tag>
                    ) : (
                        <Tag neutral>{i18n.t('Inactive')}</Tag>
                    )}
                </dd>
            </div>
            <div className={classes.infoRow}>
                <dt>{i18n.t('Concurrency Policy')}</dt>
                <dd>{formatConcurrencyPolicy(pipeline.concurrencyPolicy)}</dd>
            </div>
            <div className={classes.infoRow}>
                <dt>{i18n.t('Total Executions')}</dt>
                <dd>{pipeline._count?.executions ?? '—'}</dd>
            </div>
            <div className={classes.infoRow}>
                <dt>{i18n.t('Created At')}</dt>
                <dd>{formatDate(pipeline.createdAt)}</dd>
            </div>
            <div className={classes.infoRow}>
                <dt>{i18n.t('Updated At')}</dt>
                <dd>{formatDate(pipeline.updatedAt)}</dd>
            </div>
        </dl>
    )
}
