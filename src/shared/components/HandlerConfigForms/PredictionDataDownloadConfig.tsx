import i18n from '@dhis2/d2-i18n'
import { Button, IconCross16, InputField, NoticeBox } from '@dhis2/ui'
import React, { useEffect, useState } from 'react'
import { ConfigMappingTable } from './ConfigMappingTable'
import sharedClasses from './HandlerConfigShared.module.css'
import { QuantileTargetsSummary } from './QuantileTargetsSummary'
import { usePipelinePredictionSetup } from './usePipelinePredictionSetup'
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
    const setup = usePipelinePredictionSetup()

    useEffect(() => {
        if (setup && (rows.length > 0 || !value)) {
            setRows([])
            const rest = { ...(value ?? {}) }
            delete rest.dataElementIds
            onChange(rest)
        }
    }, [setup?.id])

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
                {setup
                    ? i18n.t(
                          'Each forecast is written where prediction setup “{{name}}” says. Change it in the Modeling app.',
                          { name: setup.name }
                      )
                    : i18n.t(
                          'This pipeline’s prediction step does not use a CHAP prediction setup yet, so the mapping is entered here. Pick an evaluation in that step and these outputs come from the setup instead. Quantiles not listed here are not downloaded.'
                      )}
            </NoticeBox>

            {setup ? (
                <FormSection
                    title={i18n.t('Forecast outputs')}
                    description={i18n.t('From the prediction setup')}
                    tight
                >
                    <QuantileTargetsSummary setup={setup} />
                </FormSection>
            ) : (
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
                                            ? i18n.t('e.g. 0.1, 0.5, 0.9')
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
            )}
        </>
    )
}
