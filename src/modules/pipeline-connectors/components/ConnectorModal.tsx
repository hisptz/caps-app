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
import {
    ConnectorFormBody,
    type ConnectorTargetOption,
} from './ConnectorFormBody'
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
import { findDuplicateConnector } from '@/modules/pipeline-connectors/utils/duplicateConnector'
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
    /** Connectors that already exist, to refuse a second one doing the same thing */
    existingConnectors?: PipelineConnector[]
    isPending: boolean
    onSubmit: (values: ConnectorFormValues) => Promise<unknown>
    /** Inside a workflow: pipelines owned by another workflow are shown but cannot be picked */
    workflowId?: string
    /** New connectors: the pipeline to start, e.g. the box a line was dragged onto */
    initialTargetId?: string
}

export function ConnectorModal({
    open,
    onClose,
    sourcePipeline,
    sourceSteps,
    connector,
    existingConnectors = [],
    isPending,
    onSubmit,
    workflowId,
    initialTargetId,
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
                : {
                      ...defaultConnectorFormValues,
                      targetPipelineId: initialTargetId ?? '',
                  }
        )
        form.clearErrors()
    }, [open, connector, form, handlersReady, initialTargetId])

    const { data: pipelinesData, isLoading: pipelinesLoading } =
        useConnectorTargetOptionsQuery(engine, open)
    // A pipeline never connects to itself. In a workflow, ones another workflow owns are
    // listed last and greyed out (the one already chosen stays pickable).
    const targetOptions: ConnectorTargetOption[] = useMemo(() => {
        const keep = new Set(
            [
                connector?.targetPipelineId,
                connector?.otherwisePipelineId,
            ].filter(Boolean)
        )
        const options = (pipelinesData?.pipelines ?? [])
            .filter((p) => p.id !== sourcePipeline.id)
            .map((p) => ({
                id: p.id,
                name: p.name,
                isActive: p.isActive,
                blockedBy:
                    workflowId &&
                    p.workflow &&
                    p.workflow.id !== workflowId &&
                    !keep.has(p.id)
                        ? p.workflow.name
                        : undefined,
            }))
        return [
            ...options.filter((p) => !p.blockedBy),
            ...options.filter((p) => p.blockedBy),
        ]
    }, [pipelinesData, sourcePipeline.id, workflowId, connector])

    async function submit(values: ConnectorFormValues) {
        const duplicate = findDuplicateConnector(
            {
                sourcePipelineId: sourcePipeline.id,
                targetPipelineId: values.targetPipelineId,
                on: values.on,
            },
            existingConnectors,
            connector?.id
        )
        if (duplicate) {
            const target = targetOptions.find(
                (p) => p.id === values.targetPipelineId
            )
            form.setError(
                'targetPipelineId',
                {
                    type: 'duplicate',
                    message: i18n.t(
                        '“{{source}}” already starts “{{target}}” through the connector “{{connector}}”. A second one would start it twice. Edit that connector instead.',
                        {
                            source: sourcePipeline.name,
                            target: target?.name ?? i18n.t('this pipeline'),
                            connector: duplicate.name,
                            interpolation: NO_ESCAPE,
                        }
                    ),
                },
                { shouldFocus: true }
            )
            return
        }
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
                            interpolation: NO_ESCAPE,
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
