import i18n from '@dhis2/d2-i18n'
import { Button } from '@dhis2/ui'
import React from 'react'
import classes from './HandlerConfigShared.module.css'

export interface ConfigMappingTableProps {
    /** Column header labels (one per grid column, excluding trailing action column). */
    columns: string[]
    /** CSS grid-template-columns for head and rows (include action column width). */
    gridTemplateColumns: string
    rowCount: number
    renderRow: (index: number) => React.ReactNode
    onAdd?: () => void
    addLabel?: string
    footerHint?: string
    emptyMessage?: string
}

/**
 * Bordered repeater table for controlled handler config mappings.
 */
export function ConfigMappingTable({
    columns,
    gridTemplateColumns,
    rowCount,
    renderRow,
    onAdd,
    addLabel,
    footerHint,
    emptyMessage,
}: ConfigMappingTableProps): React.ReactElement {
    const gridStyle = { gridTemplateColumns, alignItems: 'center' } as const

    return (
        <div className={classes.mappingPanel}>
            <div className={classes.mappingTableHead} style={gridStyle}>
                {columns.map((col) => (
                    <span key={col}>{col}</span>
                ))}
                <span />
            </div>
            {rowCount === 0 && emptyMessage ? (
                <p
                    className={classes.footerHint}
                    style={{ padding: '12px 12px 0' }}
                >
                    {emptyMessage}
                </p>
            ) : null}
            {Array.from({ length: rowCount }, (_, index) => (
                <div
                    key={index}
                    className={classes.mappingTableRow}
                    style={gridStyle}
                >
                    {renderRow(index)}
                </div>
            ))}
            {!!onAdd && (
                <div className={classes.mappingTableFooter}>
                    <Button secondary small onClick={onAdd}>
                        {addLabel ?? i18n.t('Add')}
                    </Button>
                    {footerHint ? (
                        <span className={classes.footerHint}>{footerHint}</span>
                    ) : null}
                </div>
            )}
        </div>
    )
}
