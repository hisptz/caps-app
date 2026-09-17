import i18n from '@dhis2/d2-i18n'
import { Button, IconCross16 } from '@dhis2/ui'
import React from 'react'
import { useFieldArray, useFormContext, type ArrayPath } from 'react-hook-form'
import { DataElementSelector } from './DataElementSelector'
import sharedClasses from './HandlerConfigShared.module.css'
import classes from './ThresholdGenerationConfig.module.css'
import type { PipelineStepFormWithHandlerValues } from '@/modules/pipeline-detail/schemas/stepFormSchema'

const DEFAULT_DATA_ELEMENT_IDS_PATH =
    'handlerConfig.dataElementIds' as ArrayPath<PipelineStepFormWithHandlerValues>

export interface ThresholdDataElementIdsListProps {
    arrayPath?: ArrayPath<PipelineStepFormWithHandlerValues>
    sectionLabel: string
    itemLabel: string
    addLabel: string
    helpText?: string
}

export function ThresholdDataElementIdsList({
    arrayPath = DEFAULT_DATA_ELEMENT_IDS_PATH,
    sectionLabel,
    itemLabel,
    addLabel,
    helpText,
}: ThresholdDataElementIdsListProps): React.ReactElement {
    const { control } = useFormContext<PipelineStepFormWithHandlerValues>()
    const { fields, append, remove } = useFieldArray({
        control,
        name: arrayPath,
    })

    return (
        <div className={classes.repeatableList}>
            {helpText ? (
                <p className={sharedClasses.footerHint}>{helpText}</p>
            ) : null}
            {fields.length === 0 ? (
                <p className={sharedClasses.footerHint}>
                    {i18n.t('No entries yet. Add one below.')}
                </p>
            ) : (
                fields.map((field, index) => (
                    <div key={field.id} className={classes.repeatableRow}>
                        <DataElementSelector
                            name={`${arrayPath}.${index}`}
                            label={index === 0 ? sectionLabel : itemLabel}
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
                <Button secondary small onClick={() => append('' as never)}>
                    {addLabel}
                </Button>
            </div>
        </div>
    )
}
