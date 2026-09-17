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
import React, { useState } from 'react'
import classes from './ClimateDataModals.module.css'
import type { ClimateDatasetRecord } from '@/capsApi/types'
import { useClimateSyncPlanQuery } from '@/modules/climate-data/hooks/useClimateSyncPlanQuery'
import {
    climateSyncActionDoesWork,
    formatClimateSyncAction,
} from '@/shared/utils/label.utils'

type Props = {
    dataset: ClimateDatasetRecord | null
    onClose: () => void
    onConfirm: () => void
    isPending: boolean
    errorMessage: string | null
}

export function SyncDatasetConfirmModal({
    dataset,
    onClose,
    onConfirm,
    isPending,
    errorMessage,
}: Props): React.ReactElement | null {
    const engine = useDataEngine()
    const [localError, setLocalError] = useState<string | null>(null)

    const planQuery = useClimateSyncPlanQuery(engine, dataset?.dataset_id)

    if (!dataset) {
        return null
    }

    const displayError = errorMessage ?? localError
    const syncWillDoWork =
        !planQuery.data || climateSyncActionDoesWork(planQuery.data.action)

    function handleConfirm() {
        setLocalError(null)
        onConfirm()
    }

    return (
        <Modal onClose={onClose} position="middle">
            <ModalTitle>{i18n.t('Sync dataset')}</ModalTitle>
            <ModalContent>
                <p className={classes.subtitle}>
                    {i18n.t(
                        'Sync "{{name}}" forward from its latest time step.',
                        {
                            name: dataset.dataset_name,
                        }
                    )}
                </p>
                {planQuery.isLoading && (
                    <div className={classes.loaderWrap}>
                        <CircularLoader small />
                    </div>
                )}
                {planQuery.isError && (
                    <NoticeBox warning title={i18n.t('Sync plan unavailable')}>
                        {i18n.t(
                            'The sync plan could not be loaded. You can still start the sync.'
                        )}
                    </NoticeBox>
                )}
                {planQuery.data && (
                    <div className={classes.detailGrid}>
                        <div className={classes.detailRow}>
                            <span className={classes.detailLabel}>
                                {i18n.t('Planned action')}
                            </span>
                            <p className={classes.detailValue}>
                                {formatClimateSyncAction(planQuery.data.action)}
                            </p>
                        </div>
                        <div className={classes.detailRow}>
                            <span className={classes.detailLabel}>
                                {i18n.t('Summary')}
                            </span>
                            <p className={classes.detailValue}>
                                {planQuery.data.message}
                            </p>
                        </div>
                    </div>
                )}
                {displayError && (
                    <NoticeBox error title={i18n.t('Could not start sync')}>
                        {displayError}
                    </NoticeBox>
                )}
            </ModalContent>
            <ModalActions>
                <ButtonStrip end>
                    <Button onClick={onClose} disabled={isPending}>
                        {i18n.t('Cancel')}
                    </Button>
                    <Button
                        primary={syncWillDoWork}
                        secondary={!syncWillDoWork}
                        onClick={handleConfirm}
                        loading={isPending}
                        disabled={isPending}
                    >
                        {syncWillDoWork
                            ? i18n.t('Start sync')
                            : i18n.t('Sync anyway')}
                    </Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    )
}
