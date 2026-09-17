import i18n from '@dhis2/d2-i18n'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { CapsDataEngine } from '@/capsApi/client'
import { CapsApiError } from '@/capsApi/client'
import { retryStepExecution } from '@/capsApi/endpoints'
import { capsKeys } from '@/capsApi/queryKeys'
import type { RetryStepExecutionResponse } from '@/capsApi/types'

export function mapRetryStepError(err: unknown): string {
    if (err instanceof CapsApiError) {
        return err.message
    }
    return i18n.t('Could not retry the step. Try again.')
}

export function useRetryStepExecutionMutation(
    engine: CapsDataEngine,
    executionId: string | undefined
) {
    const queryClient = useQueryClient()

    return useMutation<
        RetryStepExecutionResponse,
        unknown,
        { stepExecutionId: string; idempotencyKey: string }
    >({
        mutationFn: ({ stepExecutionId, idempotencyKey }) =>
            retryStepExecution(engine, stepExecutionId, { idempotencyKey }),
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({
                    queryKey: capsKeys.execution.detail(executionId),
                }),
                queryClient.invalidateQueries({
                    queryKey: capsKeys.executions.all(),
                }),
                queryClient.invalidateQueries({
                    queryKey: capsKeys.dashboard(),
                }),
            ])
        },
    })
}
