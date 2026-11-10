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
    NoticeBox,
    SwitchField,
    TextAreaField,
} from '@dhis2/ui'
import { zodResolver } from '@hookform/resolvers/zod'
import React, { useEffect } from 'react'
import { Controller, FormProvider, useForm, useWatch } from 'react-hook-form'
import classes from './Workflows.module.css'
import { CapsApiError } from '@/capsApi/client'
import { CronPanel } from '@/modules/pipeline-detail/components/CronPanel'
import { useWorkflowMutations } from '@/modules/workflows/hooks/useWorkflows'
import {
    defaultWorkflowFormValues,
    workflowFormSchema,
    workflowFormValuesToCreateBody,
    workflowFormValuesToUpdateBody,
    workflowToFormValues,
    type WorkflowFormValues,
} from '@/modules/workflows/schemas/workflowFormSchema'
import type { Workflow } from '@/shared/types/caps'

type Props = {
    open: boolean
    workflow?: Workflow | null
    onClose: () => void
    onSaved?: (workflow: Workflow) => void
}

const FORM_ID = 'workflow-form'

export function WorkflowModal({
    open,
    workflow,
    onClose,
    onSaved,
}: Props): React.ReactElement | null {
    const engine = useDataEngine()
    const { createWorkflowMutation, updateWorkflowMutation } =
        useWorkflowMutations(engine)
    const { show } = useAlert(
        ({ message }) => message,
        ({ type }) => ({ ...type, duration: 3000 })
    )
    const form = useForm<WorkflowFormValues>({
        resolver: zodResolver(workflowFormSchema),
        defaultValues: defaultWorkflowFormValues,
        mode: 'onBlur',
    })
    const scheduled = useWatch({ control: form.control, name: 'scheduled' })
    const rootError = form.formState.errors.root?.message
    const isEdit = Boolean(workflow)
    const pending =
        createWorkflowMutation.isPending || updateWorkflowMutation.isPending

    useEffect(() => {
        if (open) {
            form.reset(
                workflow
                    ? workflowToFormValues(workflow)
                    : defaultWorkflowFormValues
            )
            form.clearErrors()
        }
    }, [open, workflow, form])

    const onError = (err: unknown) => {
        if (err instanceof CapsApiError && err.status === 409) {
            form.setError('name', { type: 'server', message: err.message })
            return
        }
        form.setError('root', {
            type: 'server',
            message:
                err instanceof Error
                    ? err.message
                    : i18n.t('Could not save the workflow. Try again.'),
        })
    }

    const onSuccess = (saved: Workflow) => {
        show({
            message: isEdit
                ? i18n.t('Workflow updated')
                : i18n.t('Workflow created'),
            type: { success: true },
        })
        onSaved?.(saved)
        onClose()
    }

    function onSubmit(values: WorkflowFormValues) {
        if (workflow) {
            updateWorkflowMutation.mutate(
                {
                    id: workflow.id,
                    body: workflowFormValuesToUpdateBody(values),
                },
                { onSuccess, onError }
            )
        } else {
            createWorkflowMutation.mutate(
                workflowFormValuesToCreateBody(values),
                {
                    onSuccess,
                    onError,
                }
            )
        }
    }

    if (!open) {
        return null
    }

    return (
        <Modal large onClose={onClose} position="middle">
            <ModalTitle>
                {isEdit ? i18n.t('Edit workflow') : i18n.t('New workflow')}
            </ModalTitle>
            <ModalContent>
                <FormProvider {...form}>
                    <form
                        id={FORM_ID}
                        className={classes.modalBody}
                        onSubmit={form.handleSubmit(onSubmit)}
                    >
                        {!isEdit && (
                            <p className={classes.help}>
                                {i18n.t(
                                    'A workflow runs several pipelines as one process. Add its pipelines after creating it.'
                                )}
                            </p>
                        )}
                        {rootError && (
                            <NoticeBox
                                error
                                title={i18n.t('Could not save the workflow')}
                            >
                                {rootError}
                            </NoticeBox>
                        )}
                        <Controller
                            name="name"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <InputField
                                    label={i18n.t('Name')}
                                    required
                                    placeholder={i18n.t(
                                        'e.g. Monthly climate & health'
                                    )}
                                    value={field.value}
                                    onChange={({ value }) =>
                                        field.onChange(value ?? '')
                                    }
                                    onBlur={field.onBlur}
                                    error={Boolean(fieldState.error)}
                                    validationText={fieldState.error?.message}
                                />
                            )}
                        />
                        <Controller
                            name="description"
                            control={form.control}
                            render={({ field }) => (
                                <TextAreaField
                                    label={i18n.t('Description')}
                                    value={field.value ?? ''}
                                    onChange={({ value }) =>
                                        field.onChange(value ?? '')
                                    }
                                    rows={2}
                                />
                            )}
                        />
                        <Controller
                            name="isActive"
                            control={form.control}
                            render={({ field }) => (
                                <SwitchField
                                    checked={field.value}
                                    onChange={({ checked }) =>
                                        field.onChange(checked)
                                    }
                                    label={
                                        field.value
                                            ? i18n.t('Active')
                                            : i18n.t(
                                                  'Inactive (does not run, even by hand)'
                                              )
                                    }
                                />
                            )}
                        />
                        <Controller
                            name="scheduled"
                            control={form.control}
                            render={({ field }) => (
                                <SwitchField
                                    checked={field.value}
                                    onChange={({ checked }) =>
                                        field.onChange(checked)
                                    }
                                    label={i18n.t('Run on a schedule')}
                                    helpText={
                                        field.value
                                            ? undefined
                                            : i18n.t(
                                                  'Off, start it with the Trigger button'
                                              )
                                    }
                                />
                            )}
                        />
                        {scheduled && <CronPanel />}
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
                        loading={pending}
                    >
                        {isEdit ? i18n.t('Save') : i18n.t('Create workflow')}
                    </Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    )
}
