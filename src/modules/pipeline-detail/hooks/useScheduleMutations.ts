import i18n from '@dhis2/d2-i18n'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import type { CapsDataEngine } from '@/capsApi/client'
import { CapsApiError } from '@/capsApi/client'
import {
    createPipelineSchedule,
    deleteSchedule,
    pauseSchedule,
    resumeSchedule,
    updateSchedule,
} from '@/capsApi/endpoints'
import { capsKeys } from '@/capsApi/queryKeys'
import type { UpdateScheduleBody } from '@/capsApi/types'
import type { ScheduleFormValues } from '@/modules/pipeline-detail/schemas/scheduleFormSchema'
import { scheduleFormValuesToCreateBody } from '@/modules/pipeline-detail/schemas/scheduleFormSchema'

export function useScheduleMutations({
    engine,
    pipelineId,
    deleteScheduleTargetId,
    onUpdateSuccess,
    onDeleteSuccess,
    onDeleteError,
}: {
    engine: CapsDataEngine
    pipelineId: string | undefined
    deleteScheduleTargetId: string | undefined
    onUpdateSuccess: () => void
    onDeleteSuccess: () => void
    onDeleteError: (message: string) => void
}) {
    const queryClient = useQueryClient()
    const [scheduleActionError, setScheduleActionError] = useState<
        string | null
    >(null)

    const invalidatePipelineDetail = () =>
        queryClient.invalidateQueries({
            queryKey: capsKeys.pipeline.detail(pipelineId),
        })

    async function handleCreateSchedule(values: ScheduleFormValues) {
        if (!pipelineId) {
            return
        }
        const body = scheduleFormValuesToCreateBody(values)
        await createPipelineSchedule(engine, pipelineId, {
            name: body.name,
            description: body.description,
            cronExpr: body.cronExpr,
            inputContext: body.inputContext,
        })
        await invalidatePipelineDetail()
    }

    const pauseScheduleMutation = useMutation({
        mutationFn: (scheduleId: string) => pauseSchedule(engine, scheduleId),
        onSuccess: async () => {
            setScheduleActionError(null)
            await invalidatePipelineDetail()
        },
        onError: (err: unknown) => {
            setScheduleActionError(
                err instanceof CapsApiError
                    ? err.message
                    : i18n.t('Could not pause schedule. Try again.')
            )
        },
    })

    const resumeScheduleMutation = useMutation({
        mutationFn: (scheduleId: string) => resumeSchedule(engine, scheduleId),
        onSuccess: async () => {
            setScheduleActionError(null)
            await invalidatePipelineDetail()
        },
        onError: (err: unknown) => {
            setScheduleActionError(
                err instanceof CapsApiError
                    ? err.message
                    : i18n.t('Could not resume schedule. Try again.')
            )
        },
    })

    const updateScheduleMutation = useMutation({
        mutationFn: ({
            scheduleId,
            body,
        }: {
            scheduleId: string
            body: UpdateScheduleBody
        }) => updateSchedule(engine, scheduleId, body),
        onSuccess: async () => {
            await invalidatePipelineDetail()
            onUpdateSuccess()
        },
    })

    const deleteScheduleMutation = useMutation({
        mutationFn: () => deleteSchedule(engine, deleteScheduleTargetId!),
        onSuccess: async () => {
            await invalidatePipelineDetail()
            onDeleteSuccess()
        },
        onError: (err: unknown) => {
            onDeleteError(
                err instanceof CapsApiError
                    ? err.message
                    : i18n.t('Could not delete schedule. Try again.')
            )
        },
    })

    return {
        handleCreateSchedule,
        pauseScheduleMutation,
        resumeScheduleMutation,
        updateScheduleMutation,
        deleteScheduleMutation,
        scheduleActionError,
        setScheduleActionError,
    }
}
