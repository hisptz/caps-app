import React from 'react'
import classes from './FormSection.module.css'

export interface FormSectionProps {
    /** Optional 1-based step number rendered as a small badge before the title. */
    num?: number
    title: string
    description?: string
    children: React.ReactNode
    /** When true, fields stack with the tighter 12px gap. Defaults to 16px. */
    tight?: boolean
}

/**
 * Section header + body wrapper used inside DHIS2 modals/cards to group
 * related fields. Adds a thin top divider for every section after the
 * first one and a numbered chip in front of the title.
 */
export function FormSection({
    num,
    title,
    description,
    children,
    tight,
}: FormSectionProps): React.ReactElement {
    return (
        <section className={classes.section}>
            <div className={classes.head}>
                {num != null && <span className={classes.num}>{num}</span>}
                <h4 className={classes.title}>{title}</h4>
                {description && (
                    <span className={classes.desc}>— {description}</span>
                )}
            </div>
            <div
                className={[classes.body, tight ? classes.tight : '']
                    .filter(Boolean)
                    .join(' ')}
            >
                {children}
            </div>
        </section>
    )
}
