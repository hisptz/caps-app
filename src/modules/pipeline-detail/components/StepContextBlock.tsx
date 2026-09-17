import i18n from '@dhis2/d2-i18n'
import React from 'react'
import { useFormContext } from 'react-hook-form'
import type { HandlerDescriptor } from '@/capsApi/types'
import { useHandlerDisplayName } from '@/modules/handlers/utils/handlerLookup'
import type { PipelineContextFormValues } from '@/modules/pipeline-detail/schemas/pipelineContextFormSchema'
import { HandlerContextForm } from '@/shared/components/HandlerContextForms/HandlerContextForm'
import type { PipelineStep } from '@/shared/types/caps'

export function StepContextBlock({
    step,
    handlers,
    showStepHeader,
}: {
    step: PipelineStep
    handlers: HandlerDescriptor[]
    control: ReturnType<
        typeof useFormContext<PipelineContextFormValues>
    >['control']
    showStepHeader: boolean
}): React.ReactElement {
    const handlerLabel = useHandlerDisplayName(handlers, step.handlerKey)

    return (
        <div>
            {showStepHeader && (
                <h4>
                    {i18n.t('Step {{order}} — {{name}}', {
                        order: step.stepOrder + 1,
                        name: step.name,
                    })}
                    {handlerLabel ? ` · ${handlerLabel}` : ''}
                </h4>
            )}
            <div>
                <HandlerContextForm
                    handlerKey={step.handlerKey}
                    stepId={step.id}
                    handlerConfig={step.handlerConfig}
                />
            </div>
        </div>
    )
}
