import i18n from '@dhis2/d2-i18n'
import {
    Button,
    ButtonStrip,
    IconEdit16,
    Modal,
    ModalActions,
    ModalContent,
    ModalTitle,
    NoticeBox,
} from '@dhis2/ui'
import { zodResolver } from '@hookform/resolvers/zod'
import type { UseMutationResult } from '@tanstack/react-query'
import React, { useEffect, useMemo } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import classes from './ScheduleModal.module.css'
import { CapsApiError } from '@/capsApi/client'
import type { HandlerDescriptor, UpdateScheduleBody } from '@/capsApi/types'
import { ScheduleModalFormBody } from '@/modules/pipeline-detail/components/ScheduleModalFormBody'
import {
    createScheduleFormSchema,
    scheduleFormValuesToUpdateBody,
    scheduleToFormValues,
    type ScheduleFormValues,
} from '@/modules/pipeline-detail/schemas/scheduleFormSchema'
import type { PipelineSchedule, PipelineStep } from '@/shared/types/caps'
import { applyZodErrorsToForm } from '@/shared/utils/form.utils'

type UpdateVars = { scheduleId: string; body: UpdateScheduleBody }

type Props = {
    schedule: PipelineSchedule | null
    open: boolean
    onClose: () => void
    pipelineName?: string
    steps?: PipelineStep[]
    handlers?: HandlerDescriptor[]
    handlersLoading?: boolean
    updateScheduleMutation: UseMutationResult<
        unknown,
        unknown,
        UpdateVars,
        unknown
    >
}

export function PipelineEditScheduleModal({
    schedule,
    open,
    onClose,
    pipelineName,
    steps = [],
    handlers = [],
    handlersLoading = false,
    updateScheduleMutation,
}: Props): React.ReactElement | null {
    const schema = useMemo(
        () => createScheduleFormSchema(steps, handlers),
        [steps, handlers]
    )

    const form = useForm<ScheduleFormValues>({
        resolver: zodResolver(schema),
        defaultValues: schedule ? scheduleToFormValues(schedule) : undefined,
        mode: 'onBlur',
    })
    const rootError = form.formState.errors.root?.message

    useEffect(() => {
        if (open && schedule) {
            form.reset(scheduleToFormValues(schedule))
            form.clearErrors()
        }
    }, [open, schedule, steps, handlers, form])

    function onSubmit(values: ScheduleFormValues) {
        if (!schedule) {
            return
        }

        const parseResult = createScheduleFormSchema(steps, handlers).safeParse(
            values
        )
        if (!parseResult.success) {
            applyZodErrorsToForm(parseResult.error, form.setError)
            return
        }

        updateScheduleMutation.mutate(
            {
                scheduleId: schedule.id,
                body: scheduleFormValuesToUpdateBody(values),
            },
            {
                onSuccess: () => {
                    onClose()
                },
                onError: (err) => {
                    const msg =
                        err instanceof CapsApiError
                            ? err.message
                            : i18n.t('Could not update schedule. Try again.')
                    form.setError('root', { type: 'server', message: msg })
                },
            }
        )
    }

    if (!open || !schedule) {
        return null
    }

    return (
        <Modal large onClose={onClose} position="middle">
            <ModalTitle>{i18n.t('Edit schedule')}</ModalTitle>
            <ModalContent>
                <p className={classes.subtitle}>
                    {pipelineName ?? i18n.t('Pipeline')}
                </p>
                {rootError && (
                    <NoticeBox
                        error
                        title={i18n.t('Could not update schedule')}
                    >
                        {rootError}
                    </NoticeBox>
                )}
                <FormProvider {...form}>
                    <form
                        id="pipeline-edit-schedule-form"
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
                        form="pipeline-edit-schedule-form"
                        icon={<IconEdit16 />}
                        loading={updateScheduleMutation.isPending}
                    >
                        {i18n.t('Save changes')}
                    </Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    )
}
