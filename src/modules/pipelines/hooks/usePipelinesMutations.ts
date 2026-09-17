import i18n from '@dhis2/d2-i18n'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { CapsDataEngine } from '@/capsApi/client'
import { CapsApiError } from '@/capsApi/client'
import {
    createPipeline,
    deletePipeline,
    updatePipeline,
} from '@/capsApi/endpoints'
import { capsKeys } from '@/capsApi/queryKeys'
import type { CreatePipelineBody, UpdatePipelineBody } from '@/capsApi/types'

export function usePipelinesMutations(engine: CapsDataEngine) {
    const queryClient = useQueryClient()

    const invalidatePipelines = () =>
        queryClient.invalidateQueries({ queryKey: capsKeys.pipelines.all() })

    const createMutation = useMutation({
        mutationFn: (body: CreatePipelineBody) => createPipeline(engine, body),
        onSuccess: invalidatePipelines,
    })

    const editMutation = useMutation({
        mutationFn: ({
            pipelineId,
            body,
        }: {
            pipelineId: string
            body: UpdatePipelineBody
        }) => updatePipeline(engine, pipelineId, body),
        onSuccess: invalidatePipelines,
    })

    const deleteMutation = useMutation({
        mutationFn: (pipelineId: string) => deletePipeline(engine, pipelineId),
        onSuccess: invalidatePipelines,
    })

    return { createMutation, editMutation, deleteMutation }
}

export function mapCreatePipelineError(err: unknown): {
    nameError: string | null
    formError: string | null
} {
    if (err instanceof CapsApiError) {
        if (err.message.toLowerCase().includes('already exists')) {
            return {
                nameError: i18n.t('A pipeline with this name already exists'),
                formError: null,
            }
        }
        return { nameError: null, formError: err.message }
    }
    return {
        nameError: null,
        formError: i18n.t('Could not create pipeline. Try again.'),
    }
}

export function mapUpdatePipelineError(err: unknown): string {
    if (err instanceof CapsApiError) {
        return err.message
    }
    return i18n.t('Could not update pipeline. Try again.')
}

export function mapDeletePipelineError(err: unknown): string | null {
    if (err instanceof CapsApiError && err.status === 409) {
        return i18n.t('Pipeline has active executions and cannot be deleted.')
    }
    if (err instanceof CapsApiError) {
        return err.message
    }
    return i18n.t('Could not delete pipeline. Try again.')
}
