import i18n from '@dhis2/d2-i18n'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { CapsDataEngine } from '@/capsApi/client'
import { CapsApiError } from '@/capsApi/client'
import { deletePipeline, updatePipeline } from '@/capsApi/endpoints'
import { capsKeys } from '@/capsApi/queryKeys'
import type { UpdatePipelineBody } from '@/capsApi/types'

export function usePipelinePageMutations({
    engine,
    pipelineId,
    onEditSuccess,
    onDeleteSuccess,
    onDeleteError,
}: {
    engine: CapsDataEngine
    pipelineId: string | undefined
    onEditSuccess: () => void
    onDeleteSuccess: () => void
    onDeleteError: (message: string) => void
}) {
    const queryClient = useQueryClient()

    const editPipelineMutation = useMutation({
        mutationFn: ({
            pipelineId: id,
            body,
        }: {
            pipelineId: string
            body: UpdatePipelineBody
        }) => updatePipeline(engine, id, body),
        onSuccess: async (_, variables) => {
            await queryClient.invalidateQueries({
                queryKey: capsKeys.pipeline.detail(variables.pipelineId),
            })
            await queryClient.invalidateQueries({
                queryKey: capsKeys.pipelines.all(),
            })
            onEditSuccess()
        },
    })

    const deletePipelineMutation = useMutation({
        mutationFn: () => deletePipeline(engine, pipelineId!),
        onSuccess: () => {
            onDeleteSuccess()
        },
        onError: (err: unknown) => {
            if (err instanceof CapsApiError && err.status === 409) {
                onDeleteError(
                    i18n.t(
                        'Pipeline has active executions and cannot be deleted.'
                    )
                )
            } else if (err instanceof CapsApiError) {
                onDeleteError(err.message)
            } else {
                onDeleteError(i18n.t('Could not delete pipeline. Try again.'))
            }
        },
    })

    return { editPipelineMutation, deletePipelineMutation }
}
