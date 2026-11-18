import i18n from '@dhis2/d2-i18n'
import { Button, IconAdd16, IconCross16 } from '@dhis2/ui'
import React from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { DataElementSelector } from '../DataElementSelector'
import classes from './SchemaConfigForm.module.css'
import { SchemaGroup } from './SchemaGroup'

export interface SchemaDataElementListFieldProps {
    name: string
    label: string
    helpText?: string
    required: boolean
}

/** A list of data elements: one picker per row, as the data check step does it. */
export function SchemaDataElementListField({
    name,
    label,
    helpText,
    required,
}: SchemaDataElementListFieldProps): React.ReactElement {
    const { setValue } = useFormContext()
    const value = useWatch({ name }) as unknown
    const ids = Array.isArray(value) ? (value as string[]) : []
    const rows = ids.length > 0 ? ids : ['']

    const setIds = (next: string[]) =>
        setValue(name, next, { shouldDirty: true, shouldValidate: false })

    return (
        <SchemaGroup label={label} helpText={helpText} required={required}>
            <div className={classes.list}>
                {rows.map((_, index) => (
                    <div key={index} className={classes.row}>
                        <div className={classes.rowMain}>
                            <DataElementSelector
                                name={`${name}.${index}`}
                                label={i18n.t('Data element {{number}}', {
                                    number: index + 1,
                                })}
                            />
                        </div>
                        {rows.length > 1 && (
                            <Button
                                small
                                secondary
                                type="button"
                                icon={<IconCross16 />}
                                aria-label={i18n.t('Remove data element')}
                                onClick={() =>
                                    setIds(ids.filter((__, i) => i !== index))
                                }
                            />
                        )}
                    </div>
                ))}
                <div>
                    <Button
                        small
                        type="button"
                        icon={<IconAdd16 />}
                        onClick={() => setIds([...rows, ''])}
                    >
                        {i18n.t('Add data element')}
                    </Button>
                </div>
            </div>
        </SchemaGroup>
    )
}
