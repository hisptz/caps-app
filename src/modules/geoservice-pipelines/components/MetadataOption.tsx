import React from 'react'
import classes from './MetadataOption.module.css'

type OptionProps = {
    value: string
    label: string
    index: number
    disabled: boolean
    highlighted: boolean
}

export function metadataOption(detail?: string) {
    function MetadataOption({
        value,
        label,
        disabled,
        highlighted,
    }: OptionProps) {
        return (
            <span
                className={[
                    classes.option,
                    highlighted && classes.highlighted,
                    disabled && classes.disabled,
                ]
                    .filter(Boolean)
                    .join(' ')}
            >
                <span className={classes.name}>{label}</span>
                <span className={classes.meta}>
                    {detail ? `${value} · ${detail}` : value}
                </span>
            </span>
        )
    }
    return MetadataOption
}
