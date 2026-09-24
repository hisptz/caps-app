import i18n from '@dhis2/d2-i18n'
import React, { useMemo } from 'react'
import { ConfigMappingTable } from '../ConfigMappingTable'
import { useDataElementNames } from '../useDataElementNames'
import { ReadOnlyOrgUnitSelection } from '@/shared/components/HandlerConfigForms/PredictionTriggerConfig/ReadOnlyOrgUnitSelection'
import { FormSection } from '@/shared/components/ui/FormPrimitives'
import type { PredictionSetup } from '@/shared/types/caps'

export interface PredictionSetupSummaryProps {
    setup: PredictionSetup
}

const DATA_SOURCE_GRID = '160px 1fr'

export function PredictionSetupSummary({
    setup,
}: PredictionSetupSummaryProps): React.ReactElement {
    const dataElementIds = useMemo(
        () => setup.covariateSources.map(({ dataElementId }) => dataElementId),
        [setup]
    )
    const dataItemNames = useDataElementNames(dataElementIds)

    return (
        <>
            <FormSection title={i18n.t('Organisation units')} tight>
                <ReadOnlyOrgUnitSelection
                    key={setup.id}
                    orgUnitIds={setup.orgUnits}
                />
            </FormSection>

            <FormSection title={i18n.t('Data sources')} tight>
                <ConfigMappingTable
                    columns={[
                        i18n.t('Covariate (CHAP)'),
                        i18n.t('DHIS2 data item'),
                    ]}
                    gridTemplateColumns={DATA_SOURCE_GRID}
                    rowCount={setup.covariateSources.length}
                    renderRow={(index) => {
                        const source = setup.covariateSources[index]
                        return (
                            <>
                                <p style={{ fontSize: 14, margin: 0 }}>
                                    {source?.covariate}
                                </p>
                                <p style={{ fontSize: 14, margin: 0 }}>
                                    {(source &&
                                        dataItemNames[source.dataElementId]) ??
                                        source?.dataElementId}
                                </p>
                            </>
                        )
                    }}
                    emptyMessage={i18n.t(
                        'This setup does not declare any covariates.'
                    )}
                />
            </FormSection>
        </>
    )
}
