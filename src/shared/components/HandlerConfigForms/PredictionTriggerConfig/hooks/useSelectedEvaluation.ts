import { useDataEngine } from '@dhis2/app-runtime'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'
import { useWatch } from 'react-hook-form'
import { capsKeys } from '@/capsApi/queryKeys'
import {
    useEvaluationsQuery,
    usePredictionSetupQuery,
} from '@/shared/hooks/useEvaluationsQuery'
import type { Evaluation, PredictionSetup } from '@/shared/types/caps'

export type SelectedEvaluation = {
    evaluations: Evaluation[]
    evaluation: Evaluation | undefined
    setup: PredictionSetup | null | undefined
    loading: boolean
    setupLoading: boolean
    /** True once CHAP has answered and the evaluation has no prediction setup. */
    missingSetup: boolean
    error: string | undefined
    refresh: () => void
}

export function useSelectedEvaluation(): SelectedEvaluation {
    const engine = useDataEngine()
    const queryClient = useQueryClient()

    const backtestId = useWatch({ name: 'handlerConfig.backtestId' }) as
        | number
        | undefined

    const {
        data: evaluationsData,
        isError: evaluationsError,
        isLoading,
    } = useEvaluationsQuery(engine)

    const evaluations = useMemo(
        () => evaluationsData?.evaluations ?? [],
        [evaluationsData]
    )
    const evaluation = useMemo(
        () => evaluations.find(({ id }) => id === backtestId),
        [evaluations, backtestId]
    )

    const setupId = evaluation?.predictionSetupId ?? undefined
    const { data: setupData, isInitialLoading: setupLoading } =
        usePredictionSetupQuery(engine, setupId)

    const refresh = useCallback(() => {
        void queryClient.invalidateQueries({ queryKey: capsKeys.evaluations() })
        void queryClient.invalidateQueries({
            queryKey: capsKeys.predictionSetup(setupId),
        })
    }, [queryClient, setupId])

    return {
        evaluations,
        evaluation,
        setup: setupData?.setup,
        loading: isLoading,
        setupLoading,
        missingSetup: Boolean(evaluation) && setupId === undefined,
        error:
            evaluationsData?.error ??
            setupData?.error ??
            (evaluationsError ? 'CHAP is currently unreachable' : undefined),
        refresh,
    }
}
