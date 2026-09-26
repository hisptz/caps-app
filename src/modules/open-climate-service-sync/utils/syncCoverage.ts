import type { PipelineStep } from '@/shared/types/caps'

export const OPEN_CLIMATE_SERVICE_SYNC_HANDLER = 'open-climate-service-sync'
export const CLIMATE_OPENEO_CREATE_HANDLER = 'climate-openeo-create'

function readDatasetId(step: PipelineStep): string | null {
    const id = step.handlerConfig?.datasetId
    return typeof id === 'string' && id.length > 0 ? id : null
}

function readSyncedDatasetIds(step: PipelineStep): string[] {
    const ids = step.handlerConfig?.datasetIds
    return Array.isArray(ids)
        ? ids.filter((id): id is string => typeof id === 'string')
        : []
}

const byOrder = (a: PipelineStep, b: PipelineStep) => a.stepOrder - b.stepOrder

/** Datasets the pipeline's climate download steps read, in step order, without repeats. */
export function getPipelineClimateDatasetIds(steps: PipelineStep[]): string[] {
    const ids = [...steps]
        .sort(byOrder)
        .filter((step) => step.handlerKey === CLIMATE_OPENEO_CREATE_HANDLER)
        .map(readDatasetId)
        .filter((id): id is string => id !== null)
    return [...new Set(ids)]
}

export type UnsyncedClimateStep = {
    step: PipelineStep
    datasetId: string
    syncStep: PipelineStep | null
}

export function findUnsyncedClimateSteps(
    steps: PipelineStep[]
): UnsyncedClimateStep[] {
    const ordered = [...steps].sort(byOrder)
    const unsynced: UnsyncedClimateStep[] = []

    ordered.forEach((step, index) => {
        if (step.handlerKey !== CLIMATE_OPENEO_CREATE_HANDLER) {
            return
        }
        const datasetId = readDatasetId(step)
        if (!datasetId) {
            return
        }
        const earlierSyncSteps = ordered
            .slice(0, index)
            .filter((s) => s.handlerKey === OPEN_CLIMATE_SERVICE_SYNC_HANDLER)
        const covered = earlierSyncSteps.some((s) =>
            readSyncedDatasetIds(s).includes(datasetId)
        )
        if (!covered) {
            unsynced.push({
                step,
                datasetId,
                syncStep: earlierSyncSteps[0] ?? null,
            })
        }
    })

    return unsynced
}

/** The sync step's config with `datasetIds` appended to its dataset list. */
export function withSyncedDatasets(
    syncStep: PipelineStep,
    datasetIds: string[]
): Record<string, unknown> {
    const current = readSyncedDatasetIds(syncStep)
    const added = datasetIds.filter((id) => !current.includes(id))
    return {
        ...(syncStep.handlerConfig ?? {}),
        datasetIds: [...current, ...new Set(added)],
    }
}
