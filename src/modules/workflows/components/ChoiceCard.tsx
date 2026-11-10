import React from 'react'
import classes from './ChoiceCard.module.css'

type Props = {
    icon: React.ReactNode
    /** Grey icon tile instead of blue */
    neutralIcon?: boolean
    title: string
    badge?: string
    description: string
    /** "Browse templates →" style action text */
    action?: string
    /** Small grey line at the bottom, e.g. what a template makes */
    meta?: React.ReactNode
    featured?: boolean
    disabled?: boolean
    large?: boolean
    onClick: () => void
}

function ChevronRight(): React.ReactElement {
    return (
        <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
        >
            <path d="M6 3l5 5-5 5" />
        </svg>
    )
}

/** A big clickable card for picking how to start something. */
export function ChoiceCard({
    icon,
    neutralIcon,
    title,
    badge,
    description,
    action,
    meta,
    featured,
    disabled,
    large,
    onClick,
}: Props): React.ReactElement {
    return (
        <button
            type="button"
            className={[
                classes.card,
                large ? classes.large : '',
                featured ? classes.featured : '',
            ]
                .filter(Boolean)
                .join(' ')}
            disabled={disabled}
            onClick={onClick}
        >
            <span className={classes.top}>
                <span
                    className={[
                        classes.icon,
                        neutralIcon ? classes.neutralIcon : '',
                    ]
                        .filter(Boolean)
                        .join(' ')}
                >
                    {icon}
                </span>
                {badge && <span className={classes.badge}>{badge}</span>}
            </span>
            <span className={classes.title}>{title}</span>
            <span className={classes.description}>{description}</span>
            {action && (
                <span className={classes.action}>
                    {action}
                    <ChevronRight />
                </span>
            )}
            {meta && <span className={classes.meta}>{meta}</span>}
        </button>
    )
}
