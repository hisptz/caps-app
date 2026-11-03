import { useAlert, useDataEngine } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import {
    Button,
    ButtonStrip,
    InputField,
    Modal,
    ModalActions,
    ModalContent,
    ModalTitle,
} from '@dhis2/ui'
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import classes from './Workflows.module.css'
import { NO_ESCAPE } from '@/modules/pipeline-connectors/utils/connectorLabels'
import { useDuplicatePipelineMutation } from '@/modules/workflows/hooks/useWorkflows'

type Props = {
    open: boolean
    pipeline: { id: string; name: string }
    onClose: () => void
}

/** Copy a pipeline and its steps, e.g. to use it in a second workflow; opens the copy. */
export function DuplicatePipelineModal({
    open,
    pipeline,
    onClose,
}: Props): React.ReactElement | null {
    const engine = useDataEngine()
    const navigate = useNavigate()
    const mutation = useDuplicatePipelineMutation(engine)
    const { show } = useAlert(
        ({ message }) => message,
        ({ type }) => ({ ...type, duration: 3000 })
    )
    const [name, setName] = useState('')
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (open) {
            setName(
                i18n.t('{{name}} (copy)', {
                    name: pipeline.name,
                    interpolation: NO_ESCAPE,
                })
            )
            setError(null)
        }
    }, [open, pipeline.name])

    if (!open) {
        return null
    }

    const submit = (event: React.FormEvent) => {
        event.preventDefault()
        if (!name.trim()) {
            setError(i18n.t('Name is required'))
            return
        }
        mutation.mutate(
            { id: pipeline.id, name: name.trim() },
            {
                onSuccess: (copy) => {
                    show({
                        message: i18n.t('Pipeline duplicated'),
                        type: { success: true },
                    })
                    onClose()
                    navigate(`/pipelines/${copy.id}`)
                },
                onError: (err) =>
                    setError(
                        err instanceof Error
                            ? err.message
                            : i18n.t('Could not duplicate the pipeline')
                    ),
            }
        )
    }

    return (
        <Modal onClose={onClose} position="middle">
            <ModalTitle>{i18n.t('Duplicate pipeline')}</ModalTitle>
            <ModalContent>
                <form
                    id="duplicate-pipeline-form"
                    className={classes.modalBody}
                    onSubmit={submit}
                >
                    <InputField
                        label={i18n.t('Name of the copy')}
                        required
                        value={name}
                        onChange={({ value }) => {
                            setName(value ?? '')
                            setError(null)
                        }}
                        error={Boolean(error)}
                        validationText={error ?? undefined}
                    />
                    <p className={classes.help}>
                        {i18n.t('The copy gets the same steps and settings.')}
                    </p>
                </form>
            </ModalContent>
            <ModalActions>
                <ButtonStrip end>
                    <Button onClick={onClose}>{i18n.t('Cancel')}</Button>
                    <Button
                        primary
                        type="submit"
                        form="duplicate-pipeline-form"
                        loading={mutation.isPending}
                    >
                        {i18n.t('Duplicate')}
                    </Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    )
}
