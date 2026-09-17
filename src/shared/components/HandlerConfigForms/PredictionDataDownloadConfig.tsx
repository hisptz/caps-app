import i18n from '@dhis2/d2-i18n'
import { Button, IconCross16, InputField, NoticeBox } from '@dhis2/ui'
import React, { useState } from 'react'
import { ConfigMappingTable } from './ConfigMappingTable'
import sharedClasses from './HandlerConfigShared.module.css'
import { FormSection } from '@/shared/components/ui/FormPrimitives'

export interface PredictionDataDownloadConfigProps {
    value: Record<string, unknown> | null
    onChange: (v: Record<string, unknown>) => void
}

interface MappingRow {
    key: string
    uid: string
}

const QUANTILE_GRID = '1fr 1fr 40px'

function getRows(value: Record<string, unknown> | null): MappingRow[] {
    if (!value) {
        return []
    }
    const raw = value.dataElementIds
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
        return []
    }
    return Object.entries(raw as Record<string, unknown>).map(([k, v]) => ({
        key: k,
        uid: typeof v === 'string' ? v : '',
    }))
}

export function PredictionDataDownloadConfig({
    value,
    onChange,
}: PredictionDataDownloadConfigProps): React.ReactElement {
    const [rows, setRows] = useState<MappingRow[]>(() => getRows(value))

    function emitChange(updated: MappingRow[]): void {
        onChange({
            ...(value ?? {}),
            dataElementIds: Object.fromEntries(
                updated.map((r) => [r.key, r.uid])
            ),
        })
    }

    function handleKeyChange(index: number, key: string): void {
        const updated = rows.map((r, i) => (i === index ? { ...r, key } : r))
        setRows(updated)
        emitChange(updated)
    }

    function handleUidChange(index: number, uid: string): void {
        const updated = rows.map((r, i) => (i === index ? { ...r, uid } : r))
        setRows(updated)
        emitChange(updated)
    }

    function handleAddRow(): void {
        const updated = [...rows, { key: '', uid: '' }]
        setRows(updated)
        emitChange(updated)
    }

    function handleRemoveRow(index: number): void {
        const updated = rows.filter((_, i) => i !== index)
        setRows(updated)
        emitChange(updated)
    }

    return (
        <>
            <NoticeBox title={i18n.t('Quantile mapping')}>
                {i18n.t(
                    'Map each CHAP prediction quantile to a DHIS2 data element. At least one row is required. Quantiles not listed here are dropped during download.'
                )}
            </NoticeBox>

            <FormSection
                title={i18n.t('Data element ids')}
                description={i18n.t('key → value mapping')}
                tight
            >
                <ConfigMappingTable
                    columns={[i18n.t('Quantile'), i18n.t('DHIS2 UID')]}
                    gridTemplateColumns={QUANTILE_GRID}
                    rowCount={rows.length}
                    renderRow={(index) => (
                        <>
                            <InputField
                                value={rows[index]?.key ?? ''}
                                helpText={
                                    index === 0
                                        ? i18n.t('e.g. low, median, high')
                                        : undefined
                                }
                                onChange={({ value: v }) =>
                                    handleKeyChange(index, v ?? '')
                                }
                            />
                            <InputField
                                value={rows[index]?.uid ?? ''}
                                onChange={({ value: v }) =>
                                    handleUidChange(index, v ?? '')
                                }
                            />
                            <Button
                                className={sharedClasses.removeBtn}
                                secondary
                                small
                                icon={<IconCross16 />}
                                aria-label={i18n.t('Remove mapping')}
                                onClick={() => handleRemoveRow(index)}
                            />
                        </>
                    )}
                    onAdd={handleAddRow}
                    addLabel={i18n.t('Add mapping')}
                    footerHint={i18n.t('At least one mapping is required.')}
                    emptyMessage={i18n.t('No mappings yet. Add one below.')}
                />
            </FormSection>
        </>
    )
}
