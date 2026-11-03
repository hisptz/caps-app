import { useAlert, useDataEngine } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import { useWorkflowMutations } from '@/modules/workflows/hooks/useWorkflows'
import type { RunPeriodRange } from '@/shared/types/caps'

/**
 * Start a workflow and say what started, e.g. "Started 3 pipelines (1 skipped)". With a
 * period, the first pipelines' data steps cover that fixed range.
 */
export function useRunWorkflow() {
    const engine = useDataEngine()
    const { runWorkflowMutation } = useWorkflowMutations(engine)
    const { show } = useAlert(
        ({ message }) => message,
        ({ type }) => ({ ...type, duration: 5000 })
    )

    const run = (
        workflowId: string,
        period?: RunPeriodRange,
        onStarted?: () => void
    ) =>
        runWorkflowMutation.mutate(
            { id: workflowId, period },
            {
                onSuccess: ({ started, skipped, outsideRange }) => {
                    onStarted?.()
                    const message =
                        skipped.length > 0
                            ? i18n.t(
                                  'Workflow started: {{started}} pipeline(s) started, {{skipped}} did not start',
                                  {
                                      started: started.length,
                                      skipped: skipped.length,
                                  }
                              )
                            : i18n.t(
                                  'Workflow started: {{started}} pipeline(s)',
                                  {
                                      started: started.length,
                                  }
                              )
                    const outside =
                        outsideRange.length > 0
                            ? ' ' +
                              i18n.t(
                                  '{{count}} step(s) kept their own periods: {{steps}}',
                                  {
                                      count: outsideRange.length,
                                      steps: outsideRange
                                          .map((s) => s.stepName)
                                          .join(', '),
                                  }
                              )
                            : ''
                    show({
                        message: message + outside,
                        type:
                            skipped.length > 0 || outsideRange.length > 0
                                ? { warning: true }
                                : { success: true },
                    })
                },
                onError: (err) =>
                    show({
                        message:
                            err instanceof Error
                                ? err.message
                                : i18n.t('Could not start the workflow'),
                        type: { critical: true },
                    }),
            }
        )

    return {
        run,
        isRunning: runWorkflowMutation.isPending,
        runningId: runWorkflowMutation.variables?.id,
    }
}
