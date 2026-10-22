import { useDataEngine } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import { Button, InputField, SwitchField, TextAreaField } from '@dhis2/ui'
import React, { useEffect, useMemo, useRef } from 'react'
import { Controller, useFormContext, useWatch } from 'react-hook-form'
import { useParams } from 'react-router'
import { PlaceholderPicker } from './PlaceholderPicker'
import {
    defaultDhis2NotifyConfig,
    isDhis2NotifyConfig,
} from '@/modules/dhis2-notify/schemas/config'
import {
    generalPlaceholders,
    stepOutputPlaceholders,
} from '@/modules/dhis2-notify/utils/placeholders'
import {
    previousStep,
    suggestedNotifyTemplate,
} from '@/modules/dhis2-notify/utils/suggestedTemplate'
import { usePipelineDetailQuery } from '@/modules/monitoring/hooks/capsMonitoringHooks'
import type { PipelineStepFormWithHandlerValues } from '@/modules/pipeline-detail/schemas/stepFormSchema'
import { FormSection } from '@/shared/components/ui/FormPrimitives'
import { UserGroupSelector } from '@/shared/components/UserGroupSelector/UserGroupSelector'
import { UserSelector } from '@/shared/components/UserSelector/UserSelector'

type TextField = 'subject' | 'message'
type Cursor = { field: TextField; start: number; end: number }

/** Remembers where the cursor was when a text field lost focus. */
function rememberCursor(
    field: TextField,
    event: unknown,
    cursor: Cursor | null
) {
    const target = (event as { target?: unknown } | undefined)?.target
    if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement
    ) {
        return {
            field,
            start: target.selectionStart ?? target.value.length,
            end: target.selectionEnd ?? target.value.length,
        }
    }
    return cursor
}

export interface Dhis2NotifyConfigProps {
    value: Record<string, unknown> | null
    onChange: (v: Record<string, unknown>) => void
}

export function Dhis2NotifyConfig({
    value,
    onChange,
}: Dhis2NotifyConfigProps): React.ReactElement {
    const { control, getValues, setValue } =
        useFormContext<PipelineStepFormWithHandlerValues>()

    const engine = useDataEngine()
    const { id: pipelineId } = useParams<{ id: string }>()
    const pipelineQuery = usePipelineDetailQuery(
        engine,
        pipelineId,
        Boolean(pipelineId)
    )
    const pipeline = pipelineQuery.data
    const stepOrder = useWatch({ control, name: 'stepOrder' })

    const defaults = useMemo(() => defaultDhis2NotifyConfig(), [])
    const before = useMemo(
        () => previousStep(pipeline?.steps ?? [], stepOrder),
        [pipeline, stepOrder]
    )
    const suggestion = useMemo(
        () =>
            suggestedNotifyTemplate({ previousHandlerKey: before?.handlerKey }),
        [before]
    )
    const general = useMemo(() => generalPlaceholders(), [])
    const stepOutput = useMemo(
        () => stepOutputPlaceholders(before?.handlerKey),
        [before]
    )
    const cursor = useRef<Cursor | null>(null)

    // New steps start from text suggested for the step they follow; wait for the pipeline
    // so the suggestion knows it. Saved steps keep their own text.
    useEffect(() => {
        if (pipelineQuery.isInitialLoading) {
            return
        }
        const raw = getValues('handlerConfig') ?? value
        if (!isDhis2NotifyConfig(raw)) {
            const next = { ...defaults, ...suggestion, ...(raw ?? {}) }
            setValue('handlerConfig', next, { shouldDirty: false })
            onChange(next)
        }
    }, [
        defaults,
        getValues,
        onChange,
        pipelineQuery.isInitialLoading,
        setValue,
        suggestion,
        value,
    ])

    function insertPlaceholder(token: string) {
        const at = cursor.current ?? {
            field: 'message' as const,
            start: Number.MAX_SAFE_INTEGER,
            end: Number.MAX_SAFE_INTEGER,
        }
        const name = `handlerConfig.${at.field}` as const
        const current = String(getValues(name) ?? '')
        const start = Math.min(at.start, current.length)
        const end = Math.min(at.end, current.length)
        setValue(name, current.slice(0, start) + token + current.slice(end), {
            shouldDirty: true,
            shouldValidate: true,
        })
        const after = start + token.length
        cursor.current = { field: at.field, start: after, end: after }
    }

    function applySuggestion() {
        setValue('handlerConfig.subject', suggestion.subject, {
            shouldDirty: true,
            shouldValidate: true,
        })
        setValue('handlerConfig.message', suggestion.message, {
            shouldDirty: true,
            shouldValidate: true,
        })
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <FormSection
                title={i18n.t('Recipients')}
                description={i18n.t(
                    'Members receive a DHIS2 message. DHIS2 also emails a copy when email (SMTP) is configured on the server and the user has message email notifications turned on.'
                )}
                tight
            >
                <Controller
                    name="handlerConfig.recipients.userGroups"
                    control={control}
                    render={({ field, fieldState }) => (
                        <UserGroupSelector
                            label={i18n.t('User groups')}
                            required
                            selected={
                                Array.isArray(field.value)
                                    ? (field.value as string[])
                                    : []
                            }
                            onChange={field.onChange}
                            validationText={fieldState.error?.message}
                        />
                    )}
                />
                <Controller
                    name="handlerConfig.recipients.users"
                    control={control}
                    render={({ field }) => (
                        <UserSelector
                            label={i18n.t('Users')}
                            selected={
                                Array.isArray(field.value)
                                    ? (field.value as string[])
                                    : []
                            }
                            onChange={field.onChange}
                        />
                    )}
                />
            </FormSection>

            <FormSection
                title={i18n.t('Message')}
                description={i18n.t(
                    'Starts from suggested text for the step this one follows; edit it as you like.'
                )}
                tight
            >
                <Controller
                    name="handlerConfig.subject"
                    control={control}
                    render={({ field, fieldState }) => (
                        <InputField
                            label={i18n.t('Subject')}
                            required
                            value={(field.value as string) ?? ''}
                            onChange={({ value: next }) =>
                                field.onChange(next ?? '')
                            }
                            onBlur={(_payload, event) => {
                                cursor.current = rememberCursor(
                                    'subject',
                                    event,
                                    cursor.current
                                )
                                field.onBlur()
                            }}
                            error={Boolean(fieldState.error)}
                            validationText={fieldState.error?.message}
                        />
                    )}
                />
                <Controller
                    name="handlerConfig.message"
                    control={control}
                    render={({ field, fieldState }) => (
                        <TextAreaField
                            label={i18n.t('Message')}
                            required
                            rows={9}
                            value={(field.value as string) ?? ''}
                            onChange={({ value: next }) =>
                                field.onChange(next ?? '')
                            }
                            onBlur={(_payload, event) => {
                                cursor.current = rememberCursor(
                                    'message',
                                    event,
                                    cursor.current
                                )
                                field.onBlur()
                            }}
                            error={Boolean(fieldState.error)}
                            validationText={fieldState.error?.message}
                        />
                    )}
                />
                <div>
                    <Button small secondary onClick={applySuggestion}>
                        {i18n.t('Use suggested text')}
                    </Button>
                </div>
                <PlaceholderPicker
                    general={general}
                    stepOutput={stepOutput}
                    previousStepName={before?.name}
                    onInsert={insertPlaceholder}
                />
                <Controller
                    name="handlerConfig.failOnError"
                    control={control}
                    render={({ field }) => (
                        <SwitchField
                            label={i18n.t(
                                'Fail the run if the message cannot be sent'
                            )}
                            checked={Boolean(field.value)}
                            onChange={({ checked }) => field.onChange(checked)}
                        />
                    )}
                />
            </FormSection>
        </div>
    )
}
