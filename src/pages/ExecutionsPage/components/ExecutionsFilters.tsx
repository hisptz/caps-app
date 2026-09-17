import i18n from '@dhis2/d2-i18n'
import { SingleSelectField, SingleSelectOption } from '@dhis2/ui'
import React from 'react'
import classes from '../ExecutionsPage.module.css'
import type { Pipeline } from '@/shared/types/caps'

type Props = {
    pipelineOptions: Pipeline[]
    pipelineId: string
    status: string
    onPipelineChange: (pipelineId: string) => void
    onStatusChange: (status: string) => void
}

export function ExecutionsFilters({
    pipelineOptions,
    pipelineId,
    status,
    onPipelineChange,
    onStatusChange,
}: Props): React.ReactElement {
    return (
        <div className={classes.filters}>
            <SingleSelectField
                label={i18n.t('Pipeline')}
                selected={pipelineId}
                onChange={({ selected }: { selected: string }) =>
                    onPipelineChange(selected)
                }
                className={classes.filterField}
            >
                <SingleSelectOption value="" label={i18n.t('All pipelines')} />
                {pipelineOptions.map((p) => (
                    <SingleSelectOption
                        key={p.id}
                        value={p.id}
                        label={p.name}
                    />
                ))}
            </SingleSelectField>

            <SingleSelectField
                label={i18n.t('Status')}
                selected={status}
                onChange={({ selected }: { selected: string }) =>
                    onStatusChange(selected)
                }
                className={classes.filterField}
            >
                <SingleSelectOption value="" label={i18n.t('All statuses')} />
                <SingleSelectOption value="PENDING" label={i18n.t('Pending')} />
                <SingleSelectOption value="RUNNING" label={i18n.t('Running')} />
                <SingleSelectOption
                    value="AWAITING_STEP"
                    label={i18n.t('Awaiting Step')}
                />
                <SingleSelectOption
                    value="COMPLETED"
                    label={i18n.t('Completed')}
                />
                <SingleSelectOption value="FAILED" label={i18n.t('Failed')} />
                <SingleSelectOption
                    value="CANCELLED"
                    label={i18n.t('Cancelled')}
                />
                <SingleSelectOption value="PAUSED" label={i18n.t('Paused')} />
            </SingleSelectField>
        </div>
    )
}
