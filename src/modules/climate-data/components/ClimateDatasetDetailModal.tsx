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
import type { ClimateDatasetRecord } from '@/capsApi/types'
import { useClimateDatasetDetailQuery } from '@/modules/climate-data/hooks/useClimateDatasetDetailQuery'
import { formatClimateTemporalExtent } from '@/modules/climate-data/utils/formatTemporalExtent'

type Props = {
    dataset: ClimateDatasetRecord | null
    onClose: () => void
}

const formatDate = (iso: string) => new Date(iso).toLocaleString()

export function ClimateDatasetDetailModal({
    dataset,
    onClose,
}: Props): React.ReactElement | null {
    const engine = useDataEngine()

    const detailQuery = useClimateDatasetDetailQuery(
        engine,
        dataset?.dataset_id
    )

    if (!dataset) {
        return null
    }

    const detail = detailQuery.data
    const isPublished = detail?.publication.status === 'published'

    return (
        <Modal large onClose={onClose} position="middle">
            <ModalTitle>
                {detail?.dataset_name ?? dataset.dataset_name}
            </ModalTitle>
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
                        <div className={classes.detailRow}>
                            <span className={classes.detailLabel}>
                                {i18n.t('Dataset ID')}
                            </span>
                            <p className={classes.detailValue}>
                                {detail.dataset_id}
                            </p>
                        </div>
                        <div className={classes.detailRow}>
                            <span className={classes.detailLabel}>
                                {i18n.t('Template')}
                            </span>
                            <p className={classes.detailValue}>
                                {detail.source_dataset_id}
                            </p>
                        </div>
                        <div className={classes.detailRow}>
                            <span className={classes.detailLabel}>
                                {i18n.t('Variable')}
                            </span>
                            <p className={classes.detailValue}>
                                {detail.variable}
                                {detail.units ? ` (${detail.units})` : ''}
                            </p>
                        </div>
                        <div className={classes.detailRow}>
                            <span className={classes.detailLabel}>
                                {i18n.t('Period type')}
                            </span>
                            <p className={classes.detailValue}>
                                {detail.period_type}
                            </p>
                        </div>
                        <div className={classes.detailRow}>
                            <span className={classes.detailLabel}>
                                {i18n.t('Temporal extent')}
                            </span>
                            <p className={classes.detailValue}>
                                {formatClimateTemporalExtent(
                                    detail.extent.temporal
                                )}
                            </p>
                        </div>
                        <div className={classes.detailRow}>
                            <span className={classes.detailLabel}>
                                {i18n.t('Last updated')}
                            </span>
                            <p className={classes.detailValue}>
                                {formatDate(detail.last_updated)}
                            </p>
                        </div>
                        <div className={classes.detailRow}>
                            <span className={classes.detailLabel}>
                                {i18n.t('Catalogue')}
                            </span>
                            <p className={classes.detailValue}>
                                {isPublished
                                    ? i18n.t('Listed in the climate catalogue')
                                    : i18n.t(
                                          'Not listed in the climate catalogue'
                                      )}
                            </p>
                        </div>
                        {detail.versions.length > 0 && (
                            <div className={classes.detailRow}>
                                <span className={classes.detailLabel}>
                                    {i18n.t('Versions')}
                                </span>
                                <p className={classes.detailValue}>
                                    {i18n.t('{{count}} version(s)', {
                                        count: detail.versions.length,
                                    })}
                                </p>
                            </div>
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
