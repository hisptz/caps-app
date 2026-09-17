import React from 'react'
import classes from './SegmentedControl.module.css'

export interface SegmentedOption<V extends string = string> {
    value: V
    label: string
    icon?: React.ReactNode
    disabled?: boolean
}

export interface SegmentedControlProps<V extends string = string> {
    name?: string
    value: V
    options: ReadonlyArray<SegmentedOption<V>>
    onChange: (value: V) => void
    disabled?: boolean
    'aria-label'?: string
}

/**
 * Inline segmented single-select for 2–4 short options. Use when the
 * answer is mutually exclusive and the options fit on one line. For
 * longer lists or option descriptions, prefer `SingleSelectField`
 * or `RadioCardGroup`.
 */
export function SegmentedControl<V extends string = string>({
    name,
    value,
    options,
    onChange,
    disabled,
    'aria-label': ariaLabel,
}: SegmentedControlProps<V>): React.ReactElement {
    return (
        <div className={classes.seg} role="radiogroup" aria-label={ariaLabel}>
            {options.map((opt) => {
                const isOn = opt.value === value
                return (
                    <button
                        key={opt.value}
                        type="button"
                        role="radio"
                        aria-checked={isOn}
                        name={name}
                        disabled={disabled || opt.disabled}
                        className={[classes.btn, isOn && classes.on]
                            .filter(Boolean)
                            .join(' ')}
                        onClick={() => {
                            if (!isOn) {
                                onChange(opt.value)
                            }
                        }}
                    >
                        {opt.icon}
                        {opt.label}
                    </button>
                )
            })}
        </div>
    )
}
