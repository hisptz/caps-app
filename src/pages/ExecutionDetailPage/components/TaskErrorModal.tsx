import i18n from '@dhis2/d2-i18n'
import {
    Button,
    ButtonStrip,
    Modal,
    ModalActions,
    ModalContent,
    ModalTitle,
} from '@dhis2/ui'
import React from 'react'
import classes from '../ExecutionDetailPage.module.css'
import type { TaskExecution } from '@/shared/types/caps'

type Props = {
    task: TaskExecution
    onClose: () => void
}

export function TaskErrorModal({ task, onClose }: Props): React.ReactElement {
    return (
        <Modal large onClose={onClose} position="middle">
            <ModalTitle>
                {i18n.t('Task error — {{name}}', { name: task.name })}
            </ModalTitle>
            <ModalContent>
                <p className={classes.modalErrorLabel}>
                    {i18n.t('Error message')}
                </p>
                <pre className={classes.modalErrorPre}>{task.errorMessage}</pre>
                {task.errorStack && (
                    <>
                        <p className={classes.modalErrorLabel}>
                            {i18n.t('Stack trace')}
                        </p>
                        <pre className={classes.modalErrorPre}>
                            {task.errorStack}
                        </pre>
                    </>
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
