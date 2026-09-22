import i18n from '@dhis2/d2-i18n'
import {
    Button,
    IconCross16,
    InputField,
    SingleSelectField,
    SingleSelectOption,
} from '@dhis2/ui'
import React, { useMemo } from 'react'
import {
    Controller,
    useFieldArray,
    useFormContext,
    useWatch,
    type ArrayPath,
    type Path,
} from 'react-hook-form'
import sharedClasses from './HandlerConfigShared.module.css'
import classes from './ThresholdGenerationConfig.module.css'
import type { PipelineStepFormWithHandlerValues } from '@/modules/pipeline-detail/schemas/stepFormSchema'

export interface RepeatableFieldOption {
    label: string
    value: string
}

export interface ThresholdRepeatableFieldListProps {
    /** RHF path under handlerConfig, e.g. `handlerConfig.period.years` */
    name: string
    sectionLabel: string
    itemLabel: string
    addLabel: string
    helpText?: string
    type?: 'text' | 'number'
    defaultAppend?: string
    options?: RepeatableFieldOption[]
}

export function ThresholdRepeatableFieldList({
    name,
    sectionLabel,
    itemLabel,
    addLabel,
    helpText,
    type = 'text',
    defaultAppend = '',
    options,
}: ThresholdRepeatableFieldListProps): React.ReactElement {
    const { control } = useFormContext<PipelineStepFormWithHandlerValues>()
    const fieldName = name as ArrayPath<PipelineStepFormWithHandlerValues>
    const { fields, append, remove } = useFieldArray({
        control,
        name: fieldName,
    })

    const currentValues = useWatch({ control, name: fieldName }) as
        | unknown[]
        | undefined

    const selectedValues = useMemo(
        () =>
            (currentValues ?? [])
                .map((v) => (v === undefined || v === null ? '' : String(v)))
                .filter(Boolean),
        [currentValues]
    )

    const resolvedOptions = useMemo(() => {
        if (!options) {
            return undefined
        }
        const known = new Set(options.map((option) => option.value))
        const extras = selectedValues
            .filter((value) => !known.has(value))
            .map((value) => ({ label: value, value }))
        return [...extras, ...options]
    }, [options, selectedValues])

    const nextAppendValue = () => {
        if (!options) {
            return defaultAppend
        }
        const taken = new Set(selectedValues)
        return options.find((option) => !taken.has(option.value))?.value ?? ''
    }

    return (
        <div className={classes.repeatableList}>
            {fields.length === 0 ? (
                <p className={sharedClasses.footerHint}>
                    {i18n.t('No entries yet. Add one below.')}
                </p>
            ) : (
                fields.map((field, index) => (
                    <div key={field.id} className={classes.repeatableRow}>
                        <Controller
                            name={
                                `${name}.${index}` as Path<PipelineStepFormWithHandlerValues>
                            }
                            control={control}
                            render={({ field: row, fieldState }) => {
                                const value =
                                    row.value === undefined ||
                                    row.value === null
                                        ? ''
                                        : String(row.value)

                                if (resolvedOptions) {
                                    return (
                                        <SingleSelectField
                                            label={
                                                index === 0
                                                    ? sectionLabel
                                                    : undefined
                                            }
                                            helpText={
                                                index === 0
                                                    ? helpText
                                                    : undefined
                                            }
                                            selected={value}
                                            onChange={({ selected }) =>
                                                row.onChange(selected ?? '')
                                            }
                                            onBlur={row.onBlur}
                                            error={Boolean(fieldState.error)}
                                            validationText={
                                                fieldState.error?.message
                                            }
                                        >
                                            {resolvedOptions.map((option) => (
                                                <SingleSelectOption
                                                    key={option.value}
                                                    value={option.value}
                                                    label={option.label}
                                                    disabled={
                                                        option.value !==
                                                            value &&
                                                        selectedValues.includes(
                                                            option.value
                                                        )
                                                    }
                                                />
                                            ))}
                                        </SingleSelectField>
                                    )
                                }

                                return (
                                    <InputField
                                        label={
                                            index === 0
                                                ? sectionLabel
                                                : undefined
                                        }
                                        helpText={
                                            index === 0 ? helpText : undefined
                                        }
                                        type={type}
                                        value={value}
                                        onChange={({ value: v }) =>
                                            row.onChange(v ?? '')
                                        }
                                        onBlur={row.onBlur}
                                        error={Boolean(fieldState.error)}
                                        validationText={
                                            fieldState.error?.message
                                        }
                                    />
                                )
                            }}
                        />
                        <Button
                            className={classes.removeBtn}
                            secondary
                            small
                            icon={<IconCross16 />}
                            aria-label={i18n.t('Remove {{label}}', {
                                label: itemLabel,
                            })}
                            onClick={() => remove(index)}
                        />
                    </div>
                ))
            )}
            <div className={classes.addRow}>
                <Button
                    secondary
                    small
                    disabled={Boolean(options) && nextAppendValue() === ''}
                    onClick={() => append(nextAppendValue() as never)}
                >
                    {addLabel}
                </Button>
            </div>
        </div>
    )
}
