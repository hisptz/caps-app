import { useDataEngine } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import { CircularLoader, Tag } from '@dhis2/ui'
import React from 'react'
import classes from './OpenClimateServiceSyncConfig.module.css'
import { useClimateSyncPlanQuery } from '@/modules/climate-data/hooks/useClimateSyncPlanQuery'
import {
    climateSyncActionDoesWork,
    formatClimateSyncAction,
} from '@/shared/utils/label.utils'

type Props = {
    datasetIds: string[]
    datasetNames: Map<string, string>
}

/** What a sync would do to each selected dataset right now, from the planner. */
export function SyncPlanPreview({
    datasetIds,
    datasetNames,
}: Props): React.ReactElement | null {
    if (datasetIds.length === 0) {
        return null
    }
    return (
        <ul className={classes.planList}>
            {datasetIds.map((id) => (
                <SyncPlanRow
                    key={id}
                    datasetId={id}
                    name={datasetNames.get(id) ?? id}
                />
            ))}
        </ul>
    )
}

function SyncPlanRow({
    datasetId,
    name,
}: {
    datasetId: string
    name: string
}): React.ReactElement {
    const engine = useDataEngine()
    const plan = useClimateSyncPlanQuery(engine, datasetId)

    return (
        <li className={classes.planRow}>
            <span className={classes.planName}>{name}</span>
            {plan.isLoading && <CircularLoader extrasmall />}
            {plan.isError && (
                <span className={classes.planDetail}>
                    {i18n.t('Sync status unavailable')}
                </span>
            )}
            {plan.data && (
                <>
                    {climateSyncActionDoesWork(plan.data.action) ? (
                        <Tag neutral>
                            {formatClimateSyncAction(plan.data.action)}
                        </Tag>
                    ) : (
                        <Tag positive>
                            {formatClimateSyncAction(plan.data.action)}
                        </Tag>
                    )}
                    {plan.data.current_end && (
                        <span className={classes.planDetail}>
                            {i18n.t('Covers data until {{end}}', {
                                end: plan.data.current_end,
                            })}
                        </span>
                    )}
                </>
            )}
        </li>
    )
}
