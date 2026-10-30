import i18n from '@dhis2/d2-i18n'
import {
    Button,
    IconCross16,
    InputField,
    SingleSelectField,
    SingleSelectOption,
} from '@dhis2/ui'
import React, { useEffect, useState } from 'react'
import { Controller, useFormContext, useWatch } from 'react-hook-form'
import classes from './ConnectorModal.module.css'
import type { HandlerDescriptor } from '@/capsApi/types'
import type { ConnectorFormValues } from '@/modules/pipeline-connectors/schemas/connectorFormSchema'
import { RULE_OPERATORS } from '@/modules/pipeline-connectors/utils/connectorRule'
import {
    parseStepOutputPath,
    stepLabel,
    stepOutputFields,
    stepOutputPath,
} from '@/modules/pipeline-connectors/utils/stepOutputs'
import type { PipelineStep } from '@/shared/types/caps'

type Props = {
    index: number
    steps: PipelineStep[]
    handlers: HandlerDescriptor[]
    onRemove: () => void
}

/**
 * One "Only if…" condition: a step of this pipeline, one of its listed counts, and a
 * comparison with a number. Stored as
 * `stepOutputs.<stepId>.<field>`, so it follows the step when steps are reordered.
 */
export function ConnectorConditionRow({
    index,
    steps,
    handlers,
    onRemove,
}: Props): React.ReactElement {
    const { control, setValue, getFieldState, formState } =
        useFormContext<ConnectorFormValues>()
    const path = useWatch({ control, name: `ruleConditions.${index}.path` })

    const parsed = parseStepOutputPath(path, steps)
    // The chosen step lives in state so a half-finished path ("stepOutputs.<id>.") still
    // shows which step was picked
    const [stepIndex, setStepIndex] = useState<number | null>(
        parsed && parsed.stepIndex >= 0 ? parsed.stepIndex : null
    )
    const step = stepIndex === null ? undefined : steps[stepIndex]
    const fields =
        stepIndex === null
            ? []
            : (stepOutputFields(steps, stepIndex, handlers) ?? [])
    const fieldKey =
        parsed && parsed.stepIndex === stepIndex ? parsed.field : ''
    const field = fields.find((f) => f.key === fieldKey)
    const pathError = getFieldState(`ruleConditions.${index}.path`, formState)
        .error?.message

    const byPosition = parsed?.byPosition ?? false
    useEffect(() => {
        if (byPosition && step) {
            setValue(
                `ruleConditions.${index}.path`,
                stepOutputPath(step.id, fieldKey)
            )
        }
    }, [byPosition, step, fieldKey, index, setValue])

    const choose = (stepId: string, key: string) =>
        setValue(`ruleConditions.${index}.path`, stepOutputPath(stepId, key), {
            shouldValidate: true,
        })

    const chooseStep = (selected: string) => {
        const nextIndex = Number(selected)
        const nextStep = steps[nextIndex]
        const first = stepOutputFields(steps, nextIndex, handlers)?.[0]
        if (!nextStep || !first) {
            return
        }
        setStepIndex(nextIndex)
        choose(nextStep.id, first.key)
    }

    const chooseField = (selected: string) => {
        const next = fields.find((f) => f.key === selected)
        if (step && next) {
            choose(step.id, next.key)
        }
    }

    return (
        <div className={classes.conditionRow}>
            <SingleSelectField
                dense
                aria-label={i18n.t('Step')}
                placeholder={i18n.t('Choose a step')}
                selected={stepIndex === null ? undefined : String(stepIndex)}
                onChange={({ selected }) => chooseStep(selected)}
                error={Boolean(pathError) && stepIndex === null}
                validationText={stepIndex === null ? pathError : undefined}
            >
                {/* Only steps with counts to check; numbering stays the step's position */}
                {steps.flatMap((s, i) =>
                    (stepOutputFields(steps, i, handlers) ?? []).length > 0
                        ? [
                              <SingleSelectOption
                                  key={s.id}
                                  value={String(i)}
                                  label={stepLabel(s, i)}
                              />,
                          ]
                        : []
                )}
            </SingleSelectField>

            {step ? (
                <SingleSelectField
                    dense
                    aria-label={i18n.t('Result')}
                    placeholder={i18n.t('Choose a result')}
                    selected={field ? field.key : undefined}
                    onChange={({ selected }) => chooseField(selected)}
                    error={Boolean(pathError)}
                    validationText={pathError}
                >
                    {fields.map((f) => (
                        <SingleSelectOption
                            key={f.key}
                            value={f.key}
                            label={f.label}
                        />
                    ))}
                </SingleSelectField>
            ) : (
                <span />
            )}

            <Controller
                name={`ruleConditions.${index}.operator`}
                control={control}
                render={({ field: opField }) => (
                    <SingleSelectField
                        dense
                        aria-label={i18n.t('Comparison')}
                        selected={opField.value}
                        onChange={({ selected }) => opField.onChange(selected)}
                    >
                        {RULE_OPERATORS.map((op) => (
                            <SingleSelectOption
                                key={op.value}
                                value={op.value}
                                label={op.label()}
                            />
                        ))}
                    </SingleSelectField>
                )}
            />

            <Controller
                name={`ruleConditions.${index}.value`}
                control={control}
                render={({ field: valueField, fieldState }) => (
                    <InputField
                        dense
                        type="number"
                        aria-label={i18n.t('Number')}
                        placeholder="0"
                        value={valueField.value}
                        onChange={({ value }) =>
                            valueField.onChange(value ?? '')
                        }
                        onBlur={valueField.onBlur}
                        error={Boolean(fieldState.error)}
                        validationText={fieldState.error?.message}
                    />
                )}
            />

            <div className={classes.removeButton}>
                <Button
                    small
                    secondary
                    icon={<IconCross16 />}
                    aria-label={i18n.t('Remove condition')}
                    onClick={onRemove}
                />
            </div>
        </div>
    )
}
