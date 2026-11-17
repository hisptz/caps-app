import React from 'react'
import classes from './SchemaConfigForm.module.css'

export interface SchemaGroupProps {
    label: string
    helpText?: string
    required: boolean
    children: React.ReactNode
}

/** A titled frame around a field made of several inputs. */
export function SchemaGroup({
    label,
    helpText,
    required,
    children,
}: SchemaGroupProps): React.ReactElement {
    return (
        <fieldset className={classes.group}>
            <legend className={classes.legend}>
                {label}
                {required ? ' *' : ''}
            </legend>
            {helpText ? <p className={classes.help}>{helpText}</p> : null}
            {children}
        </fieldset>
    )
}
