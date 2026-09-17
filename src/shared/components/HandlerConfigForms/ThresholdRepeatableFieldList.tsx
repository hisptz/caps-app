import i18n from '@dhis2/d2-i18n'
import { Button, IconCross16, InputField } from '@dhis2/ui'
import React from 'react'
import {
    Controller,
    useFieldArray,
    useFormContext,
    type ArrayPath,
    type Path,
} from 'react-hook-form'
import sharedClasses from './HandlerConfigShared.module.css'
import classes from './ThresholdGenerationConfig.module.css'
import type { PipelineStepFormWithHandlerValues } from '@/modules/pipeline-detail/schemas/stepFormSchema'

export interface ThresholdRepeatableFieldListProps {
    /** RHF path under handlerConfig, e.g. `handlerConfig.period.years` */
    name: string
    sectionLabel: string
    itemLabel: string
    addLabel: string
    helpText?: string
    type?: 'text' | 'number'
    /** Appended value when adding a row */
    defaultAppend?: string
}

export function ThresholdRepeatableFieldList({
    name,
    sectionLabel,
    itemLabel,
    addLabel,
    helpText,
    type = 'text',
    defaultAppend = '',
}: ThresholdRepeatableFieldListProps): React.ReactElement {
    const { control } = useFormContext<PipelineStepFormWithHandlerValues>()
    const fieldName = name as ArrayPath<PipelineStepFormWithHandlerValues>
    const { fields, append, remove } = useFieldArray({
        control,
        name: fieldName,
    })

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
                            render={({ field: row, fieldState }) => (
                                <InputField
                                    label={
                                        index === 0 ? sectionLabel : undefined
                                    }
                                    helpText={
                                        index === 0 ? helpText : undefined
                                    }
                                    type={type}
                                    value={
                                        row.value === undefined ||
                                        row.value === null
                                            ? ''
                                            : String(row.value)
                                    }
                                    onChange={({ value }) =>
                                        row.onChange(value ?? '')
                                    }
                                    onBlur={row.onBlur}
                                    error={Boolean(fieldState.error)}
                                    validationText={fieldState.error?.message}
                                />
                            )}
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
                    onClick={() => append(defaultAppend as never)}
                >
                    {addLabel}
                </Button>
            </div>
        </div>
    )
}
