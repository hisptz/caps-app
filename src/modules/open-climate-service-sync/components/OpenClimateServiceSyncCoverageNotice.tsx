import { useDataEngine } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import { Button, NoticeBox } from '@dhis2/ui'
import React, { useMemo } from 'react'
import { useClimateDatasetsQuery } from '@/modules/climate-data/hooks/useClimateDatasetsQuery'
import {
    OPEN_CLIMATE_SERVICE_SYNC_HANDLER,
    findUnsyncedClimateSteps,
    withSyncedDatasets,
    type UnsyncedClimateStep,
} from '@/modules/open-climate-service-sync/utils/syncCoverage'
import type { PipelineStep } from '@/shared/types/caps'

type Props = {
    steps: PipelineStep[]
    onUpdateSyncStep: (
        syncStep: PipelineStep,
        handlerConfig: Record<string, unknown>
    ) => void
    updating: boolean
    updateError: string | null
}

export function OpenClimateServiceSyncCoverageNotice({
    steps,
    onUpdateSyncStep,
    updating,
    updateError,
}: Props): React.ReactElement | null {
    const unsynced = useMemo(() => findUnsyncedClimateSteps(steps), [steps])
    if (unsynced.length === 0) {
        return null
    }
    return (
        <CoverageWarning
            steps={steps}
            unsynced={unsynced}
            onUpdateSyncStep={onUpdateSyncStep}
            updating={updating}
            updateError={updateError}
        />
    )
}

function CoverageWarning({
    steps,
    unsynced,
    onUpdateSyncStep,
    updating,
    updateError,
}: Props & { unsynced: UnsyncedClimateStep[] }): React.ReactElement {
    const engine = useDataEngine()
    const datasetsQuery = useClimateDatasetsQuery(engine)

    const nameOf = (id: string) => {
        const d = datasetsQuery.data?.items?.find((x) => x.dataset_id === id)
        return d?.short_name ?? d?.dataset_name ?? id
    }

    const target = unsynced.find((u) => u.syncStep)?.syncStep ?? null
    const fixableIds = target
        ? [
              ...new Set(
                  unsynced
                      .filter((u) => u.syncStep?.id === target.id)
                      .map((u) => u.datasetId)
              ),
          ]
        : []
    const stranded = unsynced.filter((u) => !u.syncStep)
    const anySyncStep = steps.find(
        (s) => s.handlerKey === OPEN_CLIMATE_SERVICE_SYNC_HANDLER
    )

    return (
        <div style={{ marginBottom: 16 }}>
            <NoticeBox warning title={i18n.t('Climate data may be stale')}>
                <p style={{ marginTop: 0 }}>
                    {i18n.t(
                        'Not synced by an earlier step — {{steps}}. Scheduled runs will use whatever was last synced by hand.',
                        {
                            steps: unsynced
                                .map(
                                    (u) =>
                                        `${u.step.name} (${nameOf(u.datasetId)})`
                                )
                                .join(', '),
                            interpolation: { escapeValue: false },
                        }
                    )}
                    {stranded.length > 0 &&
                        ' ' +
                            (anySyncStep
                                ? i18n.t('Move "{{name}}" above these steps.', {
                                      name: anySyncStep.name,
                                      interpolation: { escapeValue: false },
                                  })
                                : i18n.t(
                                      'Add an Open Climate Service Sync step above these steps.'
                                  ))}
                </p>
                {target && fixableIds.length > 0 && (
                    <Button
                        small
                        loading={updating}
                        disabled={updating}
                        onClick={() =>
                            onUpdateSyncStep(
                                target,
                                withSyncedDatasets(target, fixableIds)
                            )
                        }
                    >
                        {i18n.t('Add {{datasets}} to "{{step}}"', {
                            datasets: fixableIds.map(nameOf).join(', '),
                            step: target.name,
                            interpolation: { escapeValue: false },
                        })}
                    </Button>
                )}
                {updateError && <p>{updateError}</p>}
            </NoticeBox>
        </div>
    )
}
