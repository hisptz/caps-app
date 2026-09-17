import { useAlert, useDataEngine } from '@dhis2/app-runtime'
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
import React, { useCallback, useMemo } from 'react'
import classes from './DeletePipelineConfirmModal.module.css'
import {
    mapDeletePipelineError,
    usePipelinesMutations,
} from '@/modules/pipelines/hooks/usePipelinesMutations'
import type { Pipeline } from '@/shared/types/caps'

type Props = {
    pipeline: Pipeline
    onClose: () => void
}

export function DeletePipelineConfirmModal({
    pipeline,
    onClose,
}: Props): React.ReactElement {
    const { show } = useAlert(
        ({ message }) => message,
        ({ type }) => ({ ...type, duration: 3000 })
    )
    const engine = useDataEngine()
    const { deleteMutation } = usePipelinesMutations(engine)

    const destroyed = useMemo(() => {
        const counts = pipeline._count
        if (!counts) {
            return []
        }
        const entries: string[] = []
        if (counts.steps > 0) {
            entries.push(
                counts.steps === 1
                    ? i18n.t('1 step')
                    : i18n.t('{{count}} steps', { count: counts.steps })
            )
        }
        if (counts.schedules > 0) {
            entries.push(
                counts.schedules === 1
                    ? i18n.t('1 schedule')
                    : i18n.t('{{count}} schedules', { count: counts.schedules })
            )
        }
        if (counts.executions > 0) {
            entries.push(
                counts.executions === 1
                    ? i18n.t('1 execution and its logs')
                    : i18n.t('{{count}} executions and their logs', {
                          count: counts.executions,
                      })
            )
        }
        return entries
    }, [pipeline._count])
    const onConfirm = useCallback(async () => {
        deleteMutation.mutate(pipeline.id, {
            onError: (error) => {
                show({
                    message:
                        mapDeletePipelineError(error) ??
                        i18n.t('Could not delete pipeline. Try again.'),
                    type: { error: true },
                })
                console.error(error)
            },
            onSuccess: () => {
                show({
                    message: i18n.t('Pipeline deleted successfully'),
                    type: { success: true },
                })
                onClose()
            },
        })
    }, [deleteMutation, pipeline])

    return (
        <Modal onClose={onClose}>
            <ModalTitle>{i18n.t('Delete pipeline?')}</ModalTitle>
            <ModalContent>
                <p>
                    {i18n.t(
                        'This will remove "{{name}}" and cannot be undone.',
                        { name: pipeline.name }
                    )}
                </p>
                {destroyed.length > 0 && (
                    <NoticeBox warning title={i18n.t('This also deletes')}>
                        <ul className={classes.destroyedList}>
                            {destroyed.map((entry) => (
                                <li key={entry}>{entry}</li>
                            ))}
                        </ul>
                    </NoticeBox>
                )}
            </ModalContent>
            <ModalActions>
                <ButtonStrip end>
                    <Button onClick={onClose}>{i18n.t('Cancel')}</Button>
                    <Button
                        loading={deleteMutation.isPending}
                        destructive
                        onClick={onConfirm}
                    >
                        {deleteMutation.isPending
                            ? i18n.t('Deleting…')
                            : i18n.t('Delete')}
                    </Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    )
}
