import React from 'react'
import classes from './TableScroll.module.css'

type TableScrollProps = {
    children: React.ReactNode
    /** Accessible name for the scrollable table region */
    label: string
}

/**
 * Horizontal scroll wrapper for wide DataTables on small viewports.
 */
export const TableScroll: React.FC<TableScrollProps> = ({
    children,
    label,
}) => (
    <div className={classes.wrap} role="region" aria-label={label} tabIndex={0}>
        <div className={classes.inner}>{children}</div>
    </div>
)
