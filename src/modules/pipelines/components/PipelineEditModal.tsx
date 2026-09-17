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
import { zodResolver } from '@hookform/resolvers/zod'
import React, { useEffect } from 'react'
import { FormProvider, useForm, useFormState } from 'react-hook-form'
import { PipelineFormFields } from './PipelineFormFields'
import classes from './PipelineModal.module.css'
import {
    mapUpdatePipelineError,
    usePipelinesMutations,
} from '@/modules/pipelines/hooks/usePipelinesMutations'
import {
    defaultPipelineFormValues,
    pipelineFormSchema,
    type PipelineFormValues,
} from '@/modules/pipelines/schemas/pipelineFormSchema'
import type { Pipeline } from '@/shared/types/caps'

type Props = {
    pipeline: Pipeline | null
    open: boolean
    onClose: () => void
}

function pipelineToFormValues(p: Pipeline): PipelineFormValues {
    return {
        name: p.name,
        description: p.description ?? '',
        concurrencyPolicy: p.concurrencyPolicy,
        isActive: p.isActive,
    }
}

export function PipelineEditModal({
    pipeline,
    open,
    onClose,
}: Props): React.ReactElement | null {
    const engine = useDataEngine()
    const { editMutation } = usePipelinesMutations(engine)
    const form = useForm<PipelineFormValues>({
        resolver: zodResolver(pipelineFormSchema),
        defaultValues: pipeline
            ? pipelineToFormValues(pipeline)
            : defaultPipelineFormValues,
        mode: 'onBlur',
    })
    const { isDirty } = useFormState({ control: form.control })
    const rootError = form.formState.errors.root?.message

    const { show } = useAlert(
        ({ message }) => message,
        ({ type }) => ({ ...type, duration: 3000 })
    )

    useEffect(() => {
        if (open && pipeline) {
            form.reset(pipelineToFormValues(pipeline))
            form.clearErrors()
        }
    }, [open, pipeline, form])

    function onSubmit(values: PipelineFormValues) {
        if (!pipeline) {
            return
        }
        editMutation.mutate(
            {
                pipelineId: pipeline.id,
                body: {
                    name: values.name.trim(),
                    description: values.description?.trim() || undefined,
                    isActive: values.isActive,
                    concurrencyPolicy: values.concurrencyPolicy,
                },
            },
            {
                onSuccess: () => {
                    onClose()
                    show({
                        message: i18n.t('Pipeline updated successfully'),
                        type: {
                            success: true,
                        },
                    })
                },
                onError: (err) => {
                    form.setError('root', {
                        type: 'server',
                        message: mapUpdatePipelineError(err),
                    })
                    show({
                        message: i18n.t('Failed to update pipeline'),
                        type: {
                            error: true,
                        },
                    })
                },
            }
        )
    }

    if (!open || !pipeline) {
        return null
    }

    return (
        <Modal large onClose={onClose} position="middle">
            <ModalTitle>{i18n.t('Edit pipeline')}</ModalTitle>
            <ModalContent>
                <p className={classes.subtitle}>
                    {i18n.t(
                        'Update identification or execution behaviour. Steps and schedules are managed from the pipeline detail page.'
                    )}
                </p>
                <FormProvider {...form}>
                    <form
                        id="pipeline-edit-form"
                        className={classes.modalBody}
                        onSubmit={form.handleSubmit(onSubmit)}
                    >
                        {rootError && (
                            <NoticeBox
                                error
                                title={i18n.t('Could not update pipeline')}
                            >
                                {rootError}
                            </NoticeBox>
                        )}
                        <PipelineFormFields />
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
                        form="pipeline-edit-form"
                        loading={editMutation.isPending}
                        disabled={!isDirty || editMutation.isPending}
                    >
                        {editMutation.isPending
                            ? i18n.t('Saving…')
                            : i18n.t('Save changes')}
                    </Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    )
}
