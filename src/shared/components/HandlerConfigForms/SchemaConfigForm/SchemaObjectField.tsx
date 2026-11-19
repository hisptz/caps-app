import i18n from '@dhis2/d2-i18n'
import { Button } from '@dhis2/ui'
import React from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { schemaDefaults, type JsonSchema } from './jsonSchema'
import classes from './SchemaConfigForm.module.css'
import { SchemaObjectFields } from './SchemaObjectFields'

export interface SchemaObjectFieldProps {
    name: string
    label: string
    helpText?: string
    required: boolean
    schema: JsonSchema
}

export function SchemaObjectField({
    name,
    label,
    helpText,
    required,
    schema,
}: SchemaObjectFieldProps): React.ReactElement {
    const { setValue } = useFormContext()
    const value = useWatch({ name })
    const present = required || (value !== undefined && value !== null)

    return (
        <fieldset className={classes.group}>
            <legend className={classes.legend}>
                {label}
                {required ? ' *' : ''}
            </legend>
            {helpText ? <p className={classes.help}>{helpText}</p> : null}
            {present ? (
                <SchemaObjectFields name={name} schema={schema} />
            ) : (
                <Button
                    small
                    onClick={() =>
                        setValue(name, schemaDefaults(schema), {
                            shouldDirty: true,
                        })
                    }
                >
                    {i18n.t('Add {{label}}', { label })}
                </Button>
            )}
            {present && !required ? (
                <div className={classes.groupActions}>
                    <Button
                        small
                        secondary
                        onClick={() =>
                            setValue(name, undefined, {
                                shouldDirty: true,
                                shouldValidate: true,
                            })
                        }
                    >
                        {i18n.t('Remove {{label}}', { label })}
                    </Button>
                </div>
            ) : null}
        </fieldset>
    )
}
