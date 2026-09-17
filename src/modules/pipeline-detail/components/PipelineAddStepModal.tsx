import i18n from '@dhis2/d2-i18n'
import {
    IconAdd16,
    IconChevronRight16,
    Modal,
    ModalContent,
    ModalTitle,
    NoticeBox,
} from '@dhis2/ui'
import { zodResolver } from '@hookform/resolvers/zod'
import type { UseMutationResult } from '@tanstack/react-query'
import React, { useEffect, useMemo, useState } from 'react'
import { FormProvider, useForm, useFormState, useWatch } from 'react-hook-form'
import classes from './StepWizard.module.css'
import { StepWizardBody, type StepWizardPanel } from './StepWizardBody'
import { StepWizardModalActions } from './StepWizardModalActions'
import { CapsApiError } from '@/capsApi/client'
import type { CreateStepBody, HandlerDescriptor } from '@/capsApi/types'
import { useStepWizardFlow } from '@/modules/pipeline-detail/hooks/useStepWizardFlow'
import {
    createPipelineStepFormSchema,
    defaultPipelineStepFormValues,
    type PipelineStepFormWithHandlerValues,
} from '@/modules/pipeline-detail/schemas/stepFormSchema'
import {
    applyHandlerConfigErrorsToForm,
    mapCreateStepMutationError,
} from '@/modules/pipeline-detail/utils/mapStepMutationError'
import { handleStepWizardFormSubmit } from '@/modules/pipeline-detail/utils/stepWizardNavigation'
import { getVisibleStepWizardPanels } from '@/modules/pipeline-detail/utils/stepWizardPanels'
import { applyZodErrorsToForm } from '@/shared/utils/form.utils'

type Props = {
    open: boolean
    onClose: () => void
    pipelineName?: string
    defaultStepOrder: number
    createStepMutation: UseMutationResult<
        unknown,
        unknown,
        CreateStepBody,
        unknown
    >
    handlers?: HandlerDescriptor[]
    handlersLoading?: boolean
    handlersError?: Error | null
}

export function PipelineAddStepModal({
    open,
    onClose,
    pipelineName,
    defaultStepOrder,
    createStepMutation,
    handlers,
    handlersLoading = false,
    handlersError = null,
}: Props): React.ReactElement | null {
    const formSchema = useMemo(
        () => createPipelineStepFormSchema(handlers ?? []),
        [handlers]
    )
    const form = useForm<PipelineStepFormWithHandlerValues>({
        resolver: zodResolver(formSchema),
        defaultValues: defaultPipelineStepFormValues(defaultStepOrder),
        mode: 'onBlur',
    })
    const { isSubmitting } = useFormState({ control: form.control })
    const rootError = form.formState.errors.root?.message
    const [active, setActive] = useState<StepWizardPanel>('basics')

    const catalogReady = Boolean(handlers?.length) && !handlersLoading

    const handlerKey = useWatch({ control: form.control, name: 'handlerKey' })
    const panels = useMemo(
        () => getVisibleStepWizardPanels(handlers, handlerKey),
        [handlers, handlerKey]
    )

    useEffect(() => {
        if (!panels.includes(active)) {
            setActive(panels[panels.length - 1])
        }
    }, [panels, active])

    useEffect(() => {
        if (open) {
            form.reset(defaultPipelineStepFormValues(defaultStepOrder))
            form.clearErrors()
            setActive('basics')
        }
    }, [open, defaultStepOrder, form])

    function onSubmit(values: PipelineStepFormWithHandlerValues) {
        const parseResult = createPipelineStepFormSchema(
            handlers ?? []
        ).safeParse(values)
        if (!parseResult.success) {
            applyZodErrorsToForm(parseResult.error, form.setError)
            return
        }

        createStepMutation.mutate(
            {
                name: values.name.trim(),
                description: values.description?.trim() || undefined,
                handlerKey: values.handlerKey,
                stepOrder: values.stepOrder,
                maxRetries: values.maxRetries,
                retryDelayMs: values.retryDelayMs,
                handlerConfig: values.handlerConfig ?? undefined,
            },
            {
                onSuccess: () => {
                    onClose()
                },
                onError: (err) => {
                    const mapped = mapCreateStepMutationError(
                        err,
                        values.stepOrder
                    )
                    if (mapped.stepOrderMessage) {
                        form.setError('root', {
                            type: 'server',
                            message: mapped.stepOrderMessage,
                        })
                    }
                    if (
                        err instanceof CapsApiError &&
                        mapped.handlerConfigMapped
                    ) {
                        applyHandlerConfigErrorsToForm(err.body, form.setError)
                    }
                    if (mapped.rootMessage) {
                        form.setError('root', {
                            type: 'server',
                            message: mapped.rootMessage,
                        })
                    }
                },
            }
        )
    }

    const handlerPanelBlocked =
        active === 'handler' && (!catalogReady || Boolean(handlersError))

    const {
        idx,
        isLast,
        nextPanelLabel,
        goNext,
        goBack,
        submitForm,
        handlePrimaryAction,
    } = useStepWizardFlow({
        form,
        active,
        setActive,
        onSubmit,
        panels,
        canAdvance: () => !handlerPanelBlocked,
    })

    if (!open) {
        return null
    }

    return (
        <Modal
            large
            onClose={onClose}
            position="middle"
            className={classes.stepWizardModal}
        >
            <ModalTitle>
                {i18n.t('Add step')}
                {pipelineName ? ` · ${pipelineName}` : ''}
            </ModalTitle>
            <ModalContent className={classes.modalContent}>
                {rootError && (
                    <NoticeBox error title={i18n.t('Could not add step')}>
                        {rootError}
                    </NoticeBox>
                )}
                <FormProvider {...form}>
                    <form
                        id="pipeline-add-step-form"
                        className={classes.wizardForm}
                        onSubmit={(event) =>
                            handleStepWizardFormSubmit(event, {
                                isLast,
                                onAdvance: goNext,
                                onFinalSubmit: submitForm,
                            })
                        }
                        noValidate
                    >
                        <StepWizardBody
                            pipelineName={pipelineName}
                            active={active}
                            panels={panels}
                            onActiveChange={setActive}
                            handlers={handlers}
                            handlersLoading={handlersLoading}
                            handlersError={handlersError}
                        />
                    </form>
                </FormProvider>
            </ModalContent>
            <StepWizardModalActions
                idx={idx}
                isSubmitting={isSubmitting}
                onClose={onClose}
                onBack={goBack}
                onPrimaryAction={handlePrimaryAction}
                primaryPending={createStepMutation.isPending}
                primaryDisabled={isLast ? !catalogReady : handlerPanelBlocked}
                primaryLabel={
                    isLast
                        ? i18n.t('Add step')
                        : `${i18n.t('Next')}: ${nextPanelLabel}`
                }
                primaryPendingLabel={i18n.t('Adding…')}
                primaryIcon={isLast ? <IconAdd16 /> : <IconChevronRight16 />}
            />
        </Modal>
    )
}
