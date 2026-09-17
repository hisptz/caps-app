import { useAlert, useDataEngine } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import {
    Button,
    ButtonStrip,
    IconAdd16,
    Modal,
    ModalActions,
    ModalContent,
    ModalTitle,
    NoticeBox,
} from '@dhis2/ui'
import { zodResolver } from '@hookform/resolvers/zod'
import React, { useEffect } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { PipelineFormFields } from './PipelineFormFields'
import classes from './PipelineModal.module.css'
import {
    mapCreatePipelineError,
    usePipelinesMutations,
} from '@/modules/pipelines/hooks/usePipelinesMutations'
import {
    defaultPipelineFormValues,
    pipelineFormSchema,
    type PipelineFormValues,
} from '@/modules/pipelines/schemas/pipelineFormSchema'

type Props = {
    open: boolean
    onClose: () => void
}

export function PipelineCreateModal({
    open,
    onClose,
}: Props): React.ReactElement | null {
    const engine = useDataEngine()
    const { createMutation } = usePipelinesMutations(engine)
    const form = useForm<PipelineFormValues>({
        resolver: zodResolver(pipelineFormSchema),
        defaultValues: defaultPipelineFormValues,
        mode: 'onBlur',
    })
    const { show } = useAlert(
        ({ message }) => message,
        ({ type }) => ({ ...type, duration: 3000 })
    )
    const rootError = form.formState.errors.root?.message

    useEffect(() => {
        if (open) {
            form.reset(defaultPipelineFormValues)
            form.clearErrors()
        }
    }, [open, form])

    function onSubmit(values: PipelineFormValues) {
        createMutation.mutate(
            {
                name: values.name.trim(),
                description: values.description?.trim() || undefined,
                isActive: values.isActive,
                concurrencyPolicy: values.concurrencyPolicy,
            },
            {
                onSuccess: () => {
                    show({
                        message: i18n.t('Pipeline created successfully'),
                        type: { success: true },
                    })
                    onClose()
                },
                onError: (err) => {
                    if (err instanceof Error) {
                        show({
                            message: `${i18n.t('Failed to create pipeline')}: ${err.message}`,
                            type: { error: true },
                        })
                    } else {
                        show({
                            message: `${i18n.t('Failed to create pipeline')}: ${err}`,
                            type: { error: true },
                        })
                        console.error(err)
                    }
                    const mapped = mapCreatePipelineError(err)
                    if (mapped.nameError) {
                        form.setError('name', {
                            type: 'server',
                            message: mapped.nameError,
                        })
                    }
                    if (mapped.formError) {
                        form.setError('root', {
                            type: 'server',
                            message: mapped.formError,
                        })
                    }
                },
            }
        )
    }

    if (!open) {
        return null
    }

    return (
        <Modal large onClose={onClose} position="middle">
            <ModalTitle>{i18n.t('New pipeline')}</ModalTitle>
            <ModalContent>
                <p className={classes.subtitle}>
                    {i18n.t(
                        'Define a workflow of steps that can be triggered on demand or on a schedule.'
                    )}
                </p>
                <FormProvider {...form}>
                    <form
                        id="pipeline-create-form"
                        className={classes.modalBody}
                        onSubmit={form.handleSubmit(onSubmit)}
                    >
                        {rootError && (
                            <NoticeBox
                                error
                                title={i18n.t('Could not create pipeline')}
                            >
                                {rootError}
                            </NoticeBox>
                        )}
                        <PipelineFormFields
                            namePlaceholder={i18n.t(
                                'e.g. ERA5 Daily Climate Pipeline'
                            )}
                            showHelperText
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
                        form="pipeline-create-form"
                        loading={createMutation.isPending}
                        icon={<IconAdd16 />}
                    >
                        {createMutation.isPending
                            ? i18n.t('Creating…')
                            : i18n.t('Create pipeline')}
                    </Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    )
}
