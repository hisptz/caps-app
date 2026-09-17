import { useAlert, useDataMutation } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { getTriggerPipelineMutation } from '@/capsApi/dhis2CapsRoute'
import { capsKeys } from '@/capsApi/queryKeys'
import type { TriggerPipelineResponse } from '@/capsApi/types'

export function useTriggerPipeline({ pipelineId }: { pipelineId: string }) {
    const queryClient = useQueryClient()
    const [triggerPipelineRun, { loading: triggerLoading }] = useDataMutation(
        getTriggerPipelineMutation(pipelineId ?? ''),
        { lazy: true as const }
    )

    const { show } = useAlert(
        ({ message }) => message,
        ({ type }) => ({ ...type, duration: 3000 })
    )

    const navigate = useNavigate()

    const handleTrigger = async () => {
        try {
            const data =
                (await triggerPipelineRun()) as unknown as TriggerPipelineResponse
            await queryClient.invalidateQueries({
                queryKey: capsKeys.pipelines.all(),
            })
            await queryClient.invalidateQueries({
                queryKey: capsKeys.executions.byPipeline(pipelineId),
            })
            show({
                message: i18n.t('Pipeline triggered successfully'),
                type: { success: true },
            })
            navigate(`/executions/${data.executionId}`)
        } catch (error: unknown) {
            if (error instanceof Error) {
                show({
                    message: `${i18n.t('Could not trigger pipeline')}: ${error.message}`,
                    type: { error: true },
                })
            } else {
                show({
                    message: `${i18n.t('Could not trigger pipeline')}: ${i18n.t('Unknown error')}`,
                    type: { error: true },
                })
                console.error(error)
            }
        }
    }

    return {
        handleTrigger,
        triggerLoading,
    }
}
