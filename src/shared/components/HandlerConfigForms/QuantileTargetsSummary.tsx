import i18n from '@dhis2/d2-i18n'
// eslint-disable-next-line import/named
import { colors } from '@dhis2/ui'
import React, { useMemo } from 'react'
import { useDataElementNames } from './useDataElementNames'
import type { PredictionSetup } from '@/shared/types/caps'

/**
 * The name CHAP gives a numeric quantile. Only used for setups that store numbers instead of
 * names; anything else is read straight off the setup, so new CHAP outputs show up here
 * without a change in CAPS.
 */
const QUANTILE_VALUE_KEYS: Record<string, string> = {
    '0.1': 'quantile_low',
    '0.25': 'quantile_mid_low',
    '0.5': 'median',
    '0.75': 'quantile_mid_high',
    '0.9': 'quantile_high',
}

/**
 * Labels a quantile target with CHAP's own name for it (`median`, `quantile_mid_high`,
 * `outbreak_indicator`, …), tidied for reading. Named outputs are shown as CHAP names them,
 * so if CHAP renames an output or adds one, that is what the user sees.
 */
function quantileLabel(quantile: string): string {
    const key = QUANTILE_VALUE_KEYS[String(Number(quantile))] ?? quantile
    const words = key.replace(/[_-]+/g, ' ').trim()
    return words.charAt(0).toUpperCase() + words.slice(1)
}

export interface QuantileTargetsSummaryProps {
    setup: PredictionSetup
}

/**
 * Read-only view of where each forecast quantile is written. The mapping belongs to the
 * prediction setup in CHAP.
 */
export function QuantileTargetsSummary({
    setup,
}: QuantileTargetsSummaryProps): React.ReactElement {
    const ids = useMemo(
        () => setup.quantileTargets.map(({ dataElementId }) => dataElementId),
        [setup]
    )
    const names = useDataElementNames(ids)

    if (setup.quantileTargets.length === 0) {
        return (
            <p style={{ fontSize: 14, color: colors.grey700 }}>
                {i18n.t(
                    'Prediction setup “{{name}}” has no quantile targets. Add them in the Modeling app.',
                    { name: setup.name }
                )}
            </p>
        )
    }

    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(120px, 200px) 1fr',
                rowGap: 6,
                columnGap: 16,
                padding: 12,
                border: `1px solid ${colors.grey300}`,
                borderRadius: 4,
                background: colors.grey050,
                fontSize: 14,
            }}
        >
            <span style={{ color: colors.grey700 }}>{i18n.t('Forecast')}</span>
            <span style={{ color: colors.grey700 }}>
                {i18n.t('Written to')}
            </span>
            {setup.quantileTargets.map(({ quantile, dataElementId }) => (
                <React.Fragment key={quantile}>
                    <span>{quantileLabel(quantile)}</span>
                    <span>{names[dataElementId] ?? i18n.t('Loading…')}</span>
                </React.Fragment>
            ))}
        </div>
    )
}
