import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import type { CapsDataEngine } from '@/capsApi/client'
import {
    cancelExecution,
    pauseExecution,
    resumeExecution,
} from '@/capsApi/endpoints'
import { capsKeys } from '@/capsApi/queryKeys'

export function useExecutionLifecycleActions(
    engine: CapsDataEngine,
    executionId: string | undefined
) {
    const queryClient = useQueryClient()
    const [isPausing, setIsPausing] = useState(false)
    const [isResuming, setIsResuming] = useState(false)
    const [isCancelling, setIsCancelling] = useState(false)

    const invalidateExecutionDetail = () =>
        queryClient.invalidateQueries({
            queryKey: capsKeys.execution.detail(executionId),
        })

    async function pause() {
        setIsPausing(true)
        try {
            await pauseExecution(engine, executionId!)
            await invalidateExecutionDetail()
        } finally {
            setIsPausing(false)
        }
    }

    async function resume() {
        setIsResuming(true)
        try {
            await resumeExecution(engine, executionId!)
            await invalidateExecutionDetail()
        } finally {
            setIsResuming(false)
        }
    }

    async function cancel() {
        setIsCancelling(true)
        try {
            await cancelExecution(engine, executionId!)
            await invalidateExecutionDetail()
        } finally {
            setIsCancelling(false)
        }
    }

    return { pause, resume, cancel, isPausing, isResuming, isCancelling }
}
