import i18n from '@dhis2/d2-i18n'
import { NoticeBox } from '@dhis2/ui'
import React, { useMemo } from 'react'
import { useFormContext } from 'react-hook-form'
import { StepContextBlock } from './StepContextBlock'
import type { HandlerDescriptor } from '@/capsApi/types'
import { getContextCapableSteps } from '@/modules/handlers/utils/contextCapableSteps'
import type { PipelineContextFormValues } from '@/modules/pipeline-detail/schemas/pipelineContextFormSchema'
import type { RunContextMode } from '@/shared/components/HandlerContextForms/HandlerContextForm'
import { FormSection } from '@/shared/components/ui/FormPrimitives'
import type { PipelineStep } from '@/shared/types/caps'

type Props = {
    steps: PipelineStep[]
    handlers: HandlerDescriptor[]
    handlersLoading?: boolean
    sectionNum?: number
    sectionTitle?: string
    sectionDescription?: string
    mode?: RunContextMode
}

export function PipelineRunContextSection({
    steps,
    handlers,
    handlersLoading = false,
    sectionNum = 3,
    sectionTitle = i18n.t('Input context'),
    sectionDescription = i18n.t(
        'Optional overrides applied when this pipeline runs'
    ),
    mode = 'run',
}: Props): React.ReactElement | null {
    const { control } = useFormContext<PipelineContextFormValues>()
    const contextSteps = useMemo(
        () => getContextCapableSteps(steps, handlers),
        [steps, handlers]
    )

    if (handlersLoading) {
        return null
    }

    if (contextSteps.length === 0) {
        return (
            <FormSection num={sectionNum} title={sectionTitle}>
                <NoticeBox title={i18n.t('No runtime context')}>
                    {i18n.t(
                        'No steps in this pipeline accept per-run context overrides.'
                    )}
                </NoticeBox>
            </FormSection>
        )
    }

    const singleStep = contextSteps.length === 1

    return (
        <FormSection
            num={sectionNum}
            title={sectionTitle}
            description={sectionDescription}
        >
            {contextSteps.map((step) => (
                <StepContextBlock
                    key={step.id}
                    step={step}
                    handlers={handlers}
                    control={control}
                    showStepHeader={!singleStep}
                    mode={mode}
                />
            ))}
        </FormSection>
    )
}
