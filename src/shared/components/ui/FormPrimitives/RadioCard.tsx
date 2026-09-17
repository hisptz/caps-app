import React from 'react'
import classes from './RadioCard.module.css'

export interface RadioCardOption<V extends string = string> {
    value: V
    title: string
    description?: string
    disabled?: boolean
}

export interface RadioCardGroupProps<V extends string = string> {
    name: string
    value: V
    options: ReadonlyArray<RadioCardOption<V>>
    onChange: (value: V) => void
    /** Visual column count. Defaults to options.length when ≤ 3. */
    columns?: 2 | 3
    disabled?: boolean
}

/**
 * Card-style single-select. Each option is a tappable card with a radio
 * dot, title, and short description. Use sparingly — best for short
 * mutually-exclusive choices (2–3) where the description adds context.
 */
export function RadioCardGroup<V extends string = string>({
    name,
    value,
    options,
    onChange,
    columns,
    disabled,
}: RadioCardGroupProps<V>): React.ReactElement {
    const cols = columns ?? (options.length === 2 ? 2 : 3)
    return (
        <div
            role="radiogroup"
            className={[
                classes.group,
                cols === 2 ? classes.cols2 : classes.cols3,
            ].join(' ')}
        >
            {options.map((opt) => {
                const isChecked = opt.value === value
                const isDisabled = disabled || opt.disabled
                return (
                    <label
                        key={opt.value}
                        className={[
                            classes.card,
                            isChecked && classes.checked,
                            isDisabled && classes.disabled,
                        ]
                            .filter(Boolean)
                            .join(' ')}
                    >
                        <input
                            type="radio"
                            name={name}
                            value={opt.value}
                            checked={isChecked}
                            disabled={isDisabled}
                            onChange={() => onChange(opt.value)}
                            style={{
                                position: 'absolute',
                                opacity: 0,
                                pointerEvents: 'none',
                                width: 0,
                                height: 0,
                            }}
                        />
                        <span className={classes.dot} aria-hidden />
                        <span className={classes.content}>
                            <span className={classes.titleRow}>
                                {opt.title}
                            </span>
                            {opt.description && (
                                <span className={classes.desc}>
                                    {opt.description}
                                </span>
                            )}
                        </span>
                    </label>
                )
            })}
        </div>
    )
}
