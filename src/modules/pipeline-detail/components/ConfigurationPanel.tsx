import i18n from '@dhis2/d2-i18n'
import { NoticeBox } from '@dhis2/ui'
import React, { useMemo } from 'react'
import { Controller, useFormState, useWatch } from 'react-hook-form'
import classes from './StepWizard.module.css'
import type { PipelineStepFormWithHandlerValues } from '@/modules/pipeline-detail/schemas/stepFormSchema'
import { collectHandlerConfigErrorMessages } from '@/modules/pipeline-detail/utils/collectHandlerConfigErrorMessages'
import { HandlerConfigForm } from '@/shared/components/HandlerConfigForms/HandlerConfigForm'

export function ConfigurationPanel({
    handlerKey,
}: {
    handlerKey: string | undefined
}): React.ReactElement {
    const { errors } = useFormState<PipelineStepFormWithHandlerValues>()
    const config = useWatch<PipelineStepFormWithHandlerValues, 'handlerConfig'>(
        { name: 'handlerConfig' }
    )
    const configErrorMessages = useMemo(
        () => collectHandlerConfigErrorMessages(errors.handlerConfig),
        [errors.handlerConfig]
    )

    if (!handlerKey) {
        return (
            <div className={classes.emptyState}>
                {i18n.t('Pick a handler first to configure it.')}
            </div>
        )
    }
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {configErrorMessages.length > 0 && (
                <NoticeBox
                    error
                    title={i18n.t('Handler configuration has errors')}
                >
                    <ul className={classes.configErrorList}>
                        {configErrorMessages.map((message) => (
                            <li key={message}>{message}</li>
                        ))}
                    </ul>
                </NoticeBox>
            )}
            <Controller
                name="handlerConfig"
                render={({ field }) => (
                    <HandlerConfigForm
                        handlerKey={handlerKey}
                        value={config ?? null}
                        onChange={(v) => field.onChange(v)}
                    />
                )}
            />
        </div>
    )
}
