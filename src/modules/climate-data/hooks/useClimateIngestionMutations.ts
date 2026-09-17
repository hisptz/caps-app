import i18n from '@dhis2/d2-i18n'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { CapsDataEngine } from '@/capsApi/client'
import { CapsApiError } from '@/capsApi/client'
import {
    cancelClimateIngestionJob,
    createClimateIngestion,
    syncClimateDataset,
} from '@/capsApi/endpoints'
import { capsKeys } from '@/capsApi/queryKeys'
import type {
    ClimateAsyncJobAcceptedResponse,
    CreateClimateIngestionRequest,
    SyncClimateDatasetRequest,
} from '@/capsApi/types'

export function isAsyncJobAccepted(
    result: unknown
): result is ClimateAsyncJobAcceptedResponse {
    return (
        typeof result === 'object' &&
        result !== null &&
        'jobId' in result &&
        typeof (result as ClimateAsyncJobAcceptedResponse).jobId === 'string'
    )
}

export function useClimateIngestionMutations(engine: CapsDataEngine) {
    const queryClient = useQueryClient()

    const invalidateDatasets = () =>
        queryClient.invalidateQueries({
            queryKey: capsKeys.climateDatasets.all(),
        })

    const createIngestionMutation = useMutation({
        mutationFn: (body: CreateClimateIngestionRequest) =>
            createClimateIngestion(engine, body),
    })

    const syncDatasetMutation = useMutation({
        mutationFn: ({
            datasetId,
            body,
        }: {
            datasetId: string
            body?: SyncClimateDatasetRequest
        }) => syncClimateDataset(engine, datasetId, body),
    })

    const cancelJobMutation = useMutation({
        mutationFn: (jobId: string) => cancelClimateIngestionJob(engine, jobId),
        onSuccess: invalidateDatasets,
    })

    return {
        createIngestionMutation,
        syncDatasetMutation,
        cancelJobMutation,
        invalidateDatasets,
    }
}

export function mapClimateMutationError(err: unknown): string {
    if (err instanceof CapsApiError) {
        return err.message
    }
    return i18n.t('The climate API request failed. Try again.')
}
