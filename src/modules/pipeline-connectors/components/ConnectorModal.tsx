import { useDataEngine } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import {
    Button,
    ButtonStrip,
    IconAdd16,
    IconEdit16,
    Modal,
    ModalActions,
    ModalContent,
    ModalTitle,
    NoticeBox,
} from '@dhis2/ui'
import { zodResolver } from '@hookform/resolvers/zod'
import React, { useEffect, useMemo, useRef } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { ConnectorFormBody } from './ConnectorFormBody'
import classes from './ConnectorModal.module.css'
import { CapsApiError } from '@/capsApi/client'
import { useHandlersQuery } from '@/modules/handlers/hooks/useHandlersQuery'
import { useConnectorTargetOptionsQuery } from '@/modules/pipeline-connectors/hooks/usePipelineConnectors'
import {
    defaultConnectorFormValues,
    connectorFormSchema,
    connectorToFormValues,
    type ConnectorFormValues,
} from '@/modules/pipeline-connectors/schemas/connectorFormSchema'
import { NO_ESCAPE } from '@/modules/pipeline-connectors/utils/connectorLabels'
import { rowsArePickable } from '@/modules/pipeline-connectors/utils/stepOutputs'
import type { PipelineConnector, PipelineStep } from '@/shared/types/caps'

const FORM_ID = 'pipeline-connector-form'

type Props = {
    open: boolean
    onClose: () => void
    sourcePipeline: { id: string; name: string }
    /** This pipeline's steps in order; conditions check their results */
    sourceSteps: PipelineStep[]
    /** Null to create a new connector */
    connector: PipelineConnector | null
    isPending: boolean
    onSubmit: (values: ConnectorFormValues) => Promise<unknown>
}

export function ConnectorModal({
    open,
    onClose,
    sourcePipeline,
    sourceSteps,
    connector,
    isPending,
    onSubmit,
}: Props): React.ReactElement | null {
    const engine = useDataEngine()
    const form = useForm<ConnectorFormValues>({
        resolver: zodResolver(connectorFormSchema),
        defaultValues: defaultConnectorFormValues,
        mode: 'onBlur',
    })
    const rootError = form.formState.errors.root?.message

    const { data: handlers } = useHandlersQuery(engine)
    const latest = useRef({ sourceSteps, handlers })
    latest.current = { sourceSteps, handlers }
    const handlersReady = handlers !== undefined

    useEffect(() => {
        if (!open) {
            return
        }
        const { sourceSteps: steps, handlers: loaded } = latest.current
        form.reset(
            connector
                ? connectorToFormValues(connector, (rows) =>
                      loaded ? rowsArePickable(rows, steps, loaded) : true
                  )
                : defaultConnectorFormValues
        )
        form.clearErrors()
    }, [open, connector, form, handlersReady])

    const { data: pipelinesData, isLoading: pipelinesLoading } =
        useConnectorTargetOptionsQuery(engine, open)
    // A pipeline never connectors to itself
    const targetOptions = useMemo(
        () =>
            (pipelinesData?.pipelines ?? []).filter(
                (p) => p.id !== sourcePipeline.id
            ),
        [pipelinesData, sourcePipeline.id]
    )

    async function submit(values: ConnectorFormValues) {
        try {
            await onSubmit(values)
            onClose()
        } catch (err: unknown) {
            form.setError('root', {
                type: 'server',
                message:
                    err instanceof CapsApiError
                        ? err.message
                        : i18n.t('Could not save the connector. Try again.'),
            })
        }
    }

    if (!open) {
        return null
    }

    const isEdit = connector !== null

    return (
        <Modal large onClose={onClose} position="middle">
            <ModalTitle>
                {isEdit ? i18n.t('Edit connector') : i18n.t('Add connector')}
            </ModalTitle>
            <ModalContent>
                <p className={classes.subtitle}>
                    {i18n.t(
                        'Starts another pipeline after “{{name}}” finishes',
                        {
                            name: sourcePipeline.name,
                            ...NO_ESCAPE,
                        }
                    )}
                </p>
                {rootError && (
                    <NoticeBox error title={i18n.t('Could not save connector')}>
                        {rootError}
                    </NoticeBox>
                )}
                <FormProvider {...form}>
                    <form
                        id={FORM_ID}
                        className={classes.modalBody}
                        onSubmit={form.handleSubmit(submit)}
                        noValidate
                    >
                        <ConnectorFormBody
                            targetOptions={targetOptions}
                            targetOptionsLoading={pipelinesLoading}
                            sourceSteps={sourceSteps}
                            handlers={handlers ?? []}
                        />
                    </form>
                </FormProvider>
            </ModalContent>
            <ModalActions>
                <ButtonStrip end>
                    <Button type="button" onClick={onClose}>
                        {i18n.t('Cancel')}
                    </Button>
                    <Button
                        primary
                        type="submit"
                        form={FORM_ID}
                        loading={isPending}
                        icon={isEdit ? <IconEdit16 /> : <IconAdd16 />}
                    >
                        {isEdit
                            ? i18n.t('Save changes')
                            : i18n.t('Add connector')}
                    </Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    )
}
