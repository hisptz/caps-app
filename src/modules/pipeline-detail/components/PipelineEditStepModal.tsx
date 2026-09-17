import i18n from '@dhis2/d2-i18n'
import {
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
import type { HandlerDescriptor, UpdateStepBody } from '@/capsApi/types'
import { useStepWizardFlow } from '@/modules/pipeline-detail/hooks/useStepWizardFlow'
import {
    createPipelineStepFormSchema,
    type PipelineStepFormWithHandlerValues,
    pipelineStepToFormValues,
} from '@/modules/pipeline-detail/schemas/stepFormSchema'
import {
    applyHandlerConfigErrorsToForm,
    mapUpdateStepMutationError,
} from '@/modules/pipeline-detail/utils/mapStepMutationError'
import { handleStepWizardFormSubmit } from '@/modules/pipeline-detail/utils/stepWizardNavigation'
import { getVisibleStepWizardPanels } from '@/modules/pipeline-detail/utils/stepWizardPanels'
import type { PipelineStep } from '@/shared/types/caps'
import { applyZodErrorsToForm } from '@/shared/utils/form.utils'

type UpdateVars = { stepId: string; body: UpdateStepBody }

type Props = {
    step: PipelineStep | null
    open: boolean
    onClose: () => void
    pipelineName?: string
    initialPanel?: StepWizardPanel
    updateStepMutation: UseMutationResult<unknown, unknown, UpdateVars, unknown>
    handlers?: HandlerDescriptor[]
    handlersLoading?: boolean
    handlersError?: Error | null
}

export function PipelineEditStepModal({
    step,
    open,
    onClose,
    pipelineName,
    initialPanel = 'basics',
    updateStepMutation,
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
        defaultValues: step ? pipelineStepToFormValues(step) : undefined,
        mode: 'onBlur',
    })
    const { isSubmitting, isDirty } = useFormState({ control: form.control })
    const rootError = form.formState.errors.root?.message
    const [active, setActive] = useState<StepWizardPanel>(initialPanel)

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
        if (open && step) {
            form.reset(pipelineStepToFormValues(step))
            form.clearErrors()
            setActive(initialPanel)
        }
    }, [open, step, initialPanel, form])

    function onSubmit(values: PipelineStepFormWithHandlerValues) {
        if (!step) {
            return
        }

        const parseResult = createPipelineStepFormSchema(
            handlers ?? []
        ).safeParse(values)
        if (!parseResult.success) {
            applyZodErrorsToForm(parseResult.error, form.setError)
            return
        }

        updateStepMutation.mutate(
            {
                stepId: step.id,
                body: {
                    name: values.name.trim(),
                    description: values.description?.trim() || undefined,
                    handlerKey: values.handlerKey,
                    stepOrder: values.stepOrder,
                    maxRetries: values.maxRetries,
                    retryDelayMs: values.retryDelayMs,
                    handlerConfig: values.handlerConfig ?? undefined,
                },
            },
            {
                onSuccess: () => {
                    onClose()
                },
                onError: (err) => {
                    const mapped = mapUpdateStepMutationError(err)
                    if (
                        err instanceof CapsApiError &&
                        mapped.handlerConfigMapped
                    ) {
                        applyHandlerConfigErrorsToForm(err.body, form.setError)
                    }
                    if (mapped.message) {
                        form.setError('root', {
                            type: 'server',
                            message: mapped.message,
                        })
                    }
                },
            }
        )
    }

    const {
        idx,
        isLast,
        nextPanelLabel,
        goNext,
        goBack,
        submitForm,
        handlePrimaryAction,
    } = useStepWizardFlow({ form, active, setActive, onSubmit, panels })

    if (!open || !step) {
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
                {i18n.t('Edit step')} · {step.name}
                {pipelineName ? ` · ${pipelineName}` : ''}
            </ModalTitle>
            <ModalContent className={classes.modalContent}>
                {rootError && (
                    <NoticeBox error title={i18n.t('Could not update step')}>
                        {rootError}
                    </NoticeBox>
                )}
                <FormProvider {...form}>
                    <form
                        id="pipeline-edit-step-form"
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
                            handlerSelectionDisabled
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
                primaryPending={updateStepMutation.isPending}
                primaryDisabled={
                    isLast
                        ? !isDirty ||
                          updateStepMutation.isPending ||
                          !catalogReady
                        : false
                }
                primaryLabel={
                    isLast
                        ? i18n.t('Save changes')
                        : `${i18n.t('Next')}: ${nextPanelLabel}`
                }
                primaryPendingLabel={i18n.t('Saving…')}
                primaryIcon={isLast ? undefined : <IconChevronRight16 />}
            />
        </Modal>
    )
}
