import { useDataMutation } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { CapsApiError } from '@/capsApi/client'
import { getTriggerPipelineMutation } from '@/capsApi/dhis2CapsRoute'
import { capsKeys } from '@/capsApi/queryKeys'
import type { TriggerPipelineResponse } from '@/capsApi/types'

export function useTriggerPipeline(
    pipelineId: string | undefined,
    onTriggered: (executionId: string) => void
) {
    const queryClient = useQueryClient()
    const [triggerError, setTriggerError] = useState<string | null>(null)
    const [triggerPipelineRun, { loading: triggerLoading }] = useDataMutation(
        getTriggerPipelineMutation(pipelineId ?? ''),
        { lazy: true as const }
    )

    async function handleTrigger(context?: Record<string, unknown>) {
        if (!pipelineId) {
            return
        }
        setTriggerError(null)
        try {
            const data = (await triggerPipelineRun({
                pipelineId,
                body: { context: context ?? {} },
            })) as unknown as TriggerPipelineResponse
            await queryClient.invalidateQueries({
                queryKey: capsKeys.pipeline.detail(pipelineId),
            })
            await queryClient.invalidateQueries({
                queryKey: capsKeys.executions.byPipeline(pipelineId),
            })
            onTriggered(data.executionId)
        } catch (err: unknown) {
            setTriggerError(
                err instanceof CapsApiError
                    ? err.message
                    : i18n.t('Could not trigger pipeline. Try again.')
            )
            throw err
        }
    }

    return { handleTrigger, triggerLoading, triggerError }
}
