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
import React, { useEffect, useMemo } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import classes from './ScheduleModal.module.css'
import type { HandlerDescriptor } from '@/capsApi/types'
import { ScheduleModalFormBody } from '@/modules/pipeline-detail/components/ScheduleModalFormBody'
import {
    buildScheduleFormDefaults,
    createScheduleFormSchema,
    defaultScheduleFormValues,
    type ScheduleFormValues,
} from '@/modules/pipeline-detail/schemas/scheduleFormSchema'
import type { PipelineStep } from '@/shared/types/caps'

type Props = {
    open: boolean
    onClose: () => void
    pipelineName?: string
    steps?: PipelineStep[]
    handlers?: HandlerDescriptor[]
    handlersLoading?: boolean
    onSubmitValid?: (values: ScheduleFormValues) => void | Promise<void>
}

export function PipelineAddScheduleModal({
    open,
    onClose,
    pipelineName,
    steps = [],
    handlers = [],
    handlersLoading = false,
    onSubmitValid,
}: Props): React.ReactElement | null {
    const schema = useMemo(
        () => createScheduleFormSchema(steps, handlers),
        [steps, handlers]
    )

    const form = useForm<ScheduleFormValues>({
        resolver: zodResolver(schema),
        defaultValues: defaultScheduleFormValues,
        mode: 'onBlur',
    })
    const rootError = form.formState.errors.root?.message

    useEffect(() => {
        if (open && handlers.length > 0) {
            form.reset(buildScheduleFormDefaults(steps, handlers))
            form.clearErrors()
        } else if (open) {
            form.reset(defaultScheduleFormValues)
            form.clearErrors()
        }
    }, [open, steps, handlers, form])

    async function onSubmit(values: ScheduleFormValues) {
        try {
            if (onSubmitValid) {
                await onSubmitValid(values)
            }
            onClose()
        } catch (e: unknown) {
            const msg =
                e instanceof Error
                    ? e.message
                    : i18n.t('Could not add schedule.')
            form.setError('root', { type: 'server', message: msg })
        }
    }

    if (!open) {
        return null
    }

    return (
        <Modal large onClose={onClose} position="middle">
            <ModalTitle>{i18n.t('Add schedule')}</ModalTitle>
            <ModalContent>
                <p className={classes.subtitle}>
                    {pipelineName ?? i18n.t('Pipeline')}
                </p>
                {rootError && (
                    <NoticeBox error title={i18n.t('Could not add schedule')}>
                        {rootError}
                    </NoticeBox>
                )}
                <FormProvider {...form}>
                    <form
                        id="pipeline-add-schedule-form"
                        className={classes.modalBody}
                        onSubmit={form.handleSubmit(onSubmit)}
                        noValidate
                    >
                        <ScheduleModalFormBody
                            steps={steps}
                            handlers={handlers}
                            handlersLoading={handlersLoading}
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
                        form="pipeline-add-schedule-form"
                        icon={<IconAdd16 />}
                    >
                        {i18n.t('Add schedule')}
                    </Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    )
}
