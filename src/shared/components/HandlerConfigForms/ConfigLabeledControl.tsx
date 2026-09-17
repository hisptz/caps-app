import React from 'react'
import classes from './HandlerConfigShared.module.css'

export interface ConfigLabeledControlProps {
    label: string
    helpText?: string
    required?: boolean
    children: React.ReactNode
}

/**
 * Label + optional help above a custom control (e.g. SegmentedControl).
 * Use when not wrapping in @dhis2/ui InputField.
 */
export function ConfigLabeledControl({
    label,
    helpText,
    required,
    children,
}: ConfigLabeledControlProps): React.ReactElement {
    return (
        <div className={classes.labeledControl}>
            <span className={classes.labeledControlLabel}>
                {label}
                {required ? ' *' : ''}
            </span>
            {children}
            {helpText ? (
                <p className={classes.labeledControlHelp}>{helpText}</p>
            ) : null}
        </div>
    )
}
