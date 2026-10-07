import { useDataEngine } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import {
    Button,
    ButtonStrip,
    CircularLoader,
    Modal,
    ModalActions,
    ModalContent,
    ModalTitle,
    NoticeBox,
} from '@dhis2/ui'
import React from 'react'
import classes from './ClimateDataModals.module.css'
import type { ClimateCollection } from '@/capsApi/types'
import { useClimateCollectionQuery } from '@/modules/climate-data/hooks/useClimateCollectionsQuery'
import { formatClimateTemporalExtent } from '@/modules/climate-data/utils/formatTemporalExtent'

type Props = {
    dataset: ClimateCollection | null
    onClose: () => void
}

const formatBbox = (bbox: number[]) =>
    bbox.map((value) => value.toFixed(2)).join(', ')

function DetailRow({
    label,
    children,
}: {
    label: string
    children: React.ReactNode
}): React.ReactElement {
    return (
        <div className={classes.detailRow}>
            <span className={classes.detailLabel}>{label}</span>
            <div className={classes.detailValue}>{children}</div>
        </div>
    )
}

export function ClimateDatasetDetailModal({
    dataset,
    onClose,
}: Props): React.ReactElement | null {
    const engine = useDataEngine()

    const detailQuery = useClimateCollectionQuery(engine, dataset?.id)

    if (!dataset) {
        return null
    }

    const detail = detailQuery.data

    return (
        <Modal large onClose={onClose} position="middle">
            <ModalTitle>{detail?.title ?? dataset.title}</ModalTitle>
            <ModalContent>
                {detailQuery.isLoading && (
                    <div className={classes.loaderWrap}>
                        <CircularLoader />
                    </div>
                )}
                {detailQuery.isError && (
                    <NoticeBox error title={i18n.t('Could not load details')}>
                        {i18n.t('Dataset metadata is unavailable.')}
                    </NoticeBox>
                )}
                {detail && (
                    <div className={classes.detailGrid}>
                        <DetailRow label={i18n.t('Dataset ID')}>
                            {detail.id}
                        </DetailRow>
                        {detail.description && (
                            <DetailRow label={i18n.t('Description')}>
                                {detail.description}
                            </DetailRow>
                        )}
                        <DetailRow label={i18n.t('Variables')}>
                            {detail.variables.length > 0
                                ? detail.variables
                                      .map((variable) =>
                                          variable.unit
                                              ? `${variable.name} (${variable.unit})`
                                              : variable.name
                                      )
                                      .join(', ')
                                : '—'}
                        </DetailRow>
                        <DetailRow label={i18n.t('Period type')}>
                            {detail.periodType ?? '—'}
                        </DetailRow>
                        <DetailRow label={i18n.t('Temporal extent')}>
                            {formatClimateTemporalExtent(
                                detail.extent.temporal
                            )}
                        </DetailRow>
                        {detail.extent.bbox && (
                            <DetailRow
                                label={i18n.t(
                                    'Spatial extent (west, south, east, north)'
                                )}
                            >
                                {formatBbox(detail.extent.bbox)}
                            </DetailRow>
                        )}
                        {detail.providers.length > 0 && (
                            <DetailRow label={i18n.t('Source')}>
                                {detail.providers
                                    .map((provider) => provider.name)
                                    .join(', ')}
                            </DetailRow>
                        )}
                        {detail.license && (
                            <DetailRow label={i18n.t('License')}>
                                {detail.license}
                            </DetailRow>
                        )}
                        {detail.assets.length > 0 && (
                            <DetailRow label={i18n.t('Data access')}>
                                <ul className={classes.assetList}>
                                    {detail.assets.map((asset) => (
                                        <li key={asset.key}>
                                            {asset.title ?? asset.key}:{' '}
                                            <code className={classes.assetHref}>
                                                {asset.href}
                                            </code>
                                        </li>
                                    ))}
                                </ul>
                            </DetailRow>
                        )}
                    </div>
                )}
            </ModalContent>
            <ModalActions>
                <ButtonStrip end>
                    <Button onClick={onClose}>{i18n.t('Close')}</Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    )
}
