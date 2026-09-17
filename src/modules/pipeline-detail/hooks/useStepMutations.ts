import i18n from '@dhis2/d2-i18n'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import type { CapsDataEngine } from '@/capsApi/client'
import { CapsApiError } from '@/capsApi/client'
import { createStep, deleteStep, updateStep } from '@/capsApi/endpoints'
import { capsKeys } from '@/capsApi/queryKeys'
import type { CreateStepBody, UpdateStepBody } from '@/capsApi/types'
import type { PipelineStep } from '@/shared/types/caps'

export function useStepMutations({
    engine,
    pipelineId,
    deleteStepTargetId,
    onCreateSuccess,
    onUpdateSuccess,
    onDeleteSuccess,
    onDeleteError,
}: {
    engine: CapsDataEngine
    pipelineId: string | undefined
    deleteStepTargetId: string | undefined
    onCreateSuccess: () => void
    onUpdateSuccess: () => void
    onDeleteSuccess: () => void
    onDeleteError: (message: string) => void
}) {
    const queryClient = useQueryClient()
    const [reorderError, setReorderError] = useState<string | null>(null)

    const invalidatePipelineDetail = () =>
        queryClient.invalidateQueries({
            queryKey: capsKeys.pipeline.detail(pipelineId),
        })

    const createStepMutation = useMutation({
        mutationFn: (body: CreateStepBody) =>
            createStep(engine, pipelineId!, body),
        onSuccess: async () => {
            await invalidatePipelineDetail()
            onCreateSuccess()
        },
    })

    const updateStepMutation = useMutation({
        mutationFn: ({
            stepId,
            body,
        }: {
            stepId: string
            body: UpdateStepBody
        }) => updateStep(engine, { pipelineId: pipelineId!, stepId }, body),
        onSuccess: async () => {
            await invalidatePipelineDetail()
            onUpdateSuccess()
        },
    })

    const deleteStepMutation = useMutation({
        mutationFn: () => deleteStep(engine, pipelineId!, deleteStepTargetId!),
        onSuccess: async () => {
            await invalidatePipelineDetail()
            onDeleteSuccess()
        },
        onError: (err: unknown) => {
            onDeleteError(
                err instanceof CapsApiError
                    ? err.message
                    : i18n.t('Could not delete step. Try again.')
            )
        },
    })

    async function handleStepReorder(
        steps: PipelineStep[],
        fromIndex: number,
        toIndex: number
    ) {
        const reordered = [...steps]
        const [moved] = reordered.splice(fromIndex, 1)
        reordered.splice(toIndex, 0, moved)

        const updates = reordered
            .map((step, idx) => ({ step, newOrder: idx }))
            .filter(({ step, newOrder }) => step.stepOrder !== newOrder)

        if (updates.length === 0) {
            return
        }
        setReorderError(null)
        const tempBase =
            Math.max(steps.length, ...steps.map((s) => s.stepOrder)) + 1
        try {
            await Promise.all(
                updates.map(({ step }, i) =>
                    updateStep(
                        engine,
                        { pipelineId: pipelineId!, stepId: step.id },
                        { stepOrder: tempBase + i }
                    )
                )
            )
            await Promise.all(
                updates.map(({ step, newOrder }) =>
                    updateStep(
                        engine,
                        { pipelineId: pipelineId!, stepId: step.id },
                        { stepOrder: newOrder }
                    )
                )
            )
            await invalidatePipelineDetail()
        } catch (err: unknown) {
            setReorderError(
                err instanceof CapsApiError
                    ? err.message
                    : i18n.t('Could not reorder steps. Try again.')
            )
            await invalidatePipelineDetail()
        }
    }

    return {
        createStepMutation,
        updateStepMutation,
        deleteStepMutation,
        handleStepReorder,
        reorderError,
    }
}
