import i18n from '@dhis2/d2-i18n'
import {
    Button,
    ButtonStrip,
    IconLaunch16,
    Modal,
    ModalActions,
    ModalContent,
    ModalTitle,
    NoticeBox,
} from '@dhis2/ui'
import { zodResolver } from '@hookform/resolvers/zod'
import React, { useEffect, useMemo } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import type { HandlerDescriptor } from '@/capsApi/types'
import { PipelineRunContextSection } from '@/modules/pipeline-detail/components/PipelineRunContextSection'
import {
    buildPipelineContextFormDefaults,
    createPipelineContextFormSchema,
    defaultPipelineContextFormValues,
    toPipelineInputContext,
    type PipelineContextFormValues,
} from '@/modules/pipeline-detail/schemas/pipelineContextFormSchema'
import type { PipelineStep } from '@/shared/types/caps'

type Props = {
    open: boolean
    onClose: () => void
    pipelineName?: string
    steps: PipelineStep[]
    handlers: HandlerDescriptor[]
    handlersLoading?: boolean
    onConfirm: (context: {
        steps: Record<string, Record<string, unknown>>
    }) => void | Promise<void>
    loading?: boolean
}

export function PipelineTriggerContextModal({
    open,
    onClose,
    pipelineName,
    steps,
    handlers,
    handlersLoading = false,
    onConfirm,
    loading = false,
}: Props): React.ReactElement | null {
    const schema = useMemo(
        () => createPipelineContextFormSchema(steps, handlers),
        [steps, handlers]
    )

    const form = useForm<PipelineContextFormValues>({
        resolver: zodResolver(schema),
        defaultValues: defaultPipelineContextFormValues,
        mode: 'onBlur',
    })

    const rootError = form.formState.errors.root?.message

    useEffect(() => {
        if (open && handlers.length > 0) {
            form.reset(buildPipelineContextFormDefaults(steps, handlers))
            form.clearErrors()
        }
    }, [open, steps, handlers, form])

    async function onSubmit(values: PipelineContextFormValues) {
        try {
            await onConfirm(toPipelineInputContext(values))
            onClose()
        } catch (e: unknown) {
            const msg =
                e instanceof Error
                    ? e.message
                    : i18n.t('Could not trigger pipeline.')
            form.setError('root', { type: 'server', message: msg })
        }
    }

    if (!open) {
        return null
    }

    return (
        <Modal large onClose={onClose} position="middle">
            <ModalTitle>{i18n.t('Trigger with context')}</ModalTitle>
            <ModalContent>
                <p>{pipelineName ?? i18n.t('Pipeline')}</p>
                {rootError && (
                    <NoticeBox error title={i18n.t('Could not trigger')}>
                        {rootError}
                    </NoticeBox>
                )}
                <FormProvider {...form}>
                    <form
                        id="pipeline-trigger-context-form"
                        onSubmit={form.handleSubmit(onSubmit)}
                        noValidate
                    >
                        <PipelineRunContextSection
                            steps={steps}
                            handlers={handlers}
                            handlersLoading={handlersLoading}
                            sectionNum={1}
                            sectionTitle={i18n.t('Runtime context')}
                            sectionDescription={i18n.t(
                                'Overrides merged onto each step handler config for this run'
                            )}
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
                        form="pipeline-trigger-context-form"
                        icon={<IconLaunch16 />}
                        loading={loading}
                    >
                        {i18n.t('Trigger')}
                    </Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    )
}
