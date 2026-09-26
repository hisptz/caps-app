import {
    findUnsyncedClimateSteps,
    getPipelineClimateDatasetIds,
    withSyncedDatasets,
} from './syncCoverage'
import type { PipelineStep } from '@/shared/types/caps'

function step(
    id: string,
    stepOrder: number,
    {
        handlerKey,
        handlerConfig = null,
    }: {
        handlerKey: string
        handlerConfig?: Record<string, unknown> | null
    }
): PipelineStep {
    return {
        id,
        pipelineId: 'p1',
        name: id,
        description: null,
        handlerKey,
        stepOrder,
        maxRetries: 3,
        retryDelayMs: 1000,
        inputSchema: null,
        handlerConfig,
    }
}

const create = (id: string, order: number, datasetId: string) =>
    step(id, order, {
        handlerKey: 'climate-openeo-create',
        handlerConfig: { datasetId },
    })
const sync = (id: string, order: number, datasetIds: string[]) =>
    step(id, order, {
        handlerKey: 'open-climate-service-sync',
        handlerConfig: { datasetIds, onFailure: 'fail' },
    })

describe('getPipelineClimateDatasetIds', () => {
    it('lists each climate download dataset once, in step order', () => {
        const steps = [
            create('precip', 4, 'chirps'),
            step('poll', 1, { handlerKey: 'climate-openeo-poll' }),
            create('temp', 0, 'era5'),
            create('temp-again', 8, 'era5'),
        ]
        expect(getPipelineClimateDatasetIds(steps)).toEqual(['era5', 'chirps'])
    })
})

describe('findUnsyncedClimateSteps', () => {
    it('flags every climate download when the pipeline has no sync step', () => {
        const result = findUnsyncedClimateSteps([
            create('temp', 0, 'era5'),
            create('precip', 4, 'chirps'),
        ])
        expect(result.map((r) => [r.step.id, r.datasetId, r.syncStep])).toEqual(
            [
                ['temp', 'era5', null],
                ['precip', 'chirps', null],
            ]
        )
    })

    it('accepts datasets synced by an earlier step', () => {
        expect(
            findUnsyncedClimateSteps([
                sync('sync', 0, ['era5', 'chirps']),
                create('temp', 1, 'era5'),
                create('precip', 5, 'chirps'),
            ])
        ).toEqual([])
    })

    it('flags a dataset missing from the sync step and points at that step', () => {
        const syncStep = sync('sync', 0, ['era5'])
        const result = findUnsyncedClimateSteps([
            syncStep,
            create('temp', 1, 'era5'),
            create('precip', 5, 'chirps'),
        ])
        expect(result).toHaveLength(1)
        expect(result[0]).toMatchObject({
            datasetId: 'chirps',
            syncStep,
        })
    })

    it('does not count a sync step that runs after the download', () => {
        const result = findUnsyncedClimateSteps([
            create('temp', 0, 'era5'),
            sync('sync', 1, ['era5']),
        ])
        expect(result.map((r) => [r.datasetId, r.syncStep])).toEqual([
            ['era5', null],
        ])
    })

    it('ignores climate steps without a dataset yet', () => {
        expect(
            findUnsyncedClimateSteps([
                step('temp', 0, {
                    handlerKey: 'climate-openeo-create',
                    handlerConfig: {},
                }),
            ])
        ).toEqual([])
    })
})

describe('withSyncedDatasets', () => {
    it('appends the datasets and keeps the rest of the config', () => {
        expect(
            withSyncedDatasets(sync('s', 0, ['era5']), ['chirps', 'chirps'])
        ).toEqual({
            datasetIds: ['era5', 'chirps'],
            onFailure: 'fail',
        })
    })

    it('does not duplicate a dataset already listed', () => {
        expect(
            withSyncedDatasets(sync('s', 0, ['era5']), ['era5']).datasetIds
        ).toEqual(['era5'])
    })
})
