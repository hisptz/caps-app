import i18n from '@dhis2/d2-i18n'
import {
    Button,
    ButtonStrip,
    Modal,
    ModalActions,
    ModalContent,
    ModalTitle,
    NoticeBox,
} from '@dhis2/ui'
import React from 'react'
import { NO_ESCAPE } from '@/modules/pipeline-connectors/utils/connectorLabels'
import type { PipelineMerge } from '@/shared/types/caps'

type Props = {
    merge: PipelineMerge
    error: string | null
    isPending: boolean
    onClose: () => void
    onConfirm: () => void
}

export function DeleteMergeModal({
    merge,
    error,
    isPending,
    onClose,
    onConfirm,
}: Props): React.ReactElement {
    return (
        <Modal onClose={onClose}>
            <ModalTitle>{i18n.t('Delete connector?')}</ModalTitle>
            <ModalContent>
                <p>
                    {i18n.t(
                        'This removes "{{name}}" and its decisions. Runs it already started are kept. This cannot be undone.',
                        { name: merge.name, ...NO_ESCAPE }
                    )}
                </p>
                {error && (
                    <NoticeBox
                        error
                        title={i18n.t('Could not delete connector')}
                    >
                        {error}
                    </NoticeBox>
                )}
            </ModalContent>
            <ModalActions>
                <ButtonStrip end>
                    <Button onClick={onClose}>{i18n.t('Cancel')}</Button>
                    <Button
                        destructive
                        disabled={isPending}
                        onClick={onConfirm}
                    >
                        {isPending ? i18n.t('Deleting…') : i18n.t('Delete')}
                    </Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    )
}
