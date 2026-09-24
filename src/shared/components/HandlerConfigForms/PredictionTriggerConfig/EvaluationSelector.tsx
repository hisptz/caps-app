import i18n from '@dhis2/d2-i18n'
import { SingleSelectField, SingleSelectOption } from '@dhis2/ui'
import React from 'react'
import { useController, useFormContext } from 'react-hook-form'
import {
    DEFAULT_PERIODS_TO_GENERATE,
    lastCompletePeriodId,
} from '@/shared/components/HandlerConfigForms/PredictionTriggerConfig/periodIds'
import type { Evaluation } from '@/shared/types/caps'

export interface EvaluationSelectorProps {
    evaluations: Evaluation[]
    loading: boolean
    error: string | undefined
}

export function EvaluationSelector({
    evaluations,
    loading,
    error,
}: EvaluationSelectorProps): React.ReactElement {
    const { setValue, getValues } = useFormContext()
    const { field, fieldState } = useController({
        name: 'handlerConfig.backtestId',
    })

    function handleChange(selected: string): void {
        const backtestId = Number(selected)
        const evaluation = evaluations.find(({ id }) => id === backtestId)
        const current = (getValues('handlerConfig') ?? {}) as Record<
            string,
            unknown
        >
        const next = { ...current }
        const period = {
            ...((current.period as Record<string, unknown>) ?? {}),
        }
        if (
            typeof period.endPeriod !== 'string' &&
            period.periodOffset == null
        ) {
            period.endPeriod = lastCompletePeriodId(
                evaluation?.periodType ?? null
            )
        }
        if (typeof period.numberOfPeriodsToGenerate !== 'number') {
            period.numberOfPeriodsToGenerate = DEFAULT_PERIODS_TO_GENERATE
        }
        next.period = period

        next.backtestId = backtestId
        if (evaluation?.predictionSetupId) {
            next.predictionSetupId = evaluation.predictionSetupId
        } else {
            delete next.predictionSetupId
        }

        setValue('handlerConfig', next, {
            shouldDirty: true,
            shouldValidate: typeof next.name === 'string' && next.name !== '',
        })
        field.onChange(backtestId)
    }

    return (
        <SingleSelectField
            label={i18n.t('Evaluations')}
            required
            helpText={i18n.t(
                'Choose the evaluation to use for this prediction.'
            )}
            error={!!error || !!fieldState.error}
            validationText={error ?? fieldState.error?.message}
            loading={loading}
            selected={
                evaluations.some(({ id }) => id === field.value)
                    ? String(field.value)
                    : undefined
            }
            onChange={({ selected }: { selected: string }) =>
                handleChange(selected)
            }
        >
            {evaluations.map((evaluation) => (
                <SingleSelectOption
                    key={evaluation.id}
                    value={String(evaluation.id)}
                    label={`${evaluation.name} — ${evaluation.modelDisplayName}`}
                />
            ))}
        </SingleSelectField>
    )
}
