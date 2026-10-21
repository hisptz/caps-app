import i18n from '@dhis2/d2-i18n'
import { InputField, SwitchField, TextAreaField } from '@dhis2/ui'
import React, { useEffect, useMemo } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import classes from './Dhis2NotifyConfig.module.css'
import {
    defaultDhis2NotifyConfig,
    isDhis2NotifyConfig,
} from '@/modules/dhis2-notify/schemas/config'
import type { PipelineStepFormWithHandlerValues } from '@/modules/pipeline-detail/schemas/stepFormSchema'
import { FormSection } from '@/shared/components/ui/FormPrimitives'
import { UserGroupSelector } from '@/shared/components/UserGroupSelector/UserGroupSelector'
import { UserSelector } from '@/shared/components/UserSelector/UserSelector'

function placeholderHelp(): Array<{ token: string; description: string }> {
    return [
        { token: '{{stepName}}', description: i18n.t('Name of this step') },
        { token: '{{executionId}}', description: i18n.t('ID of the run') },
        {
            token: '{{date}}',
            description: i18n.t('Today’s date in the DHIS2 server time zone'),
        },
        {
            token: '{{input.<field>}}',
            description: i18n.t(
                'A field of the previous step’s output, e.g. input.imported after DHIS2 Data Upload'
            ),
        },
    ]
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

    const defaults = useMemo(() => defaultDhis2NotifyConfig(), [])

    useEffect(() => {
        const raw = getValues('handlerConfig') ?? value
        if (!isDhis2NotifyConfig(raw)) {
            const next = { ...defaults, ...(raw ?? {}) }
            setValue('handlerConfig', next, { shouldDirty: false })
            onChange(next)
        }
    }, [defaults, getValues, onChange, setValue, value])

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
                    'Subject and message can include placeholders, filled in when the step runs.'
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
                            onBlur={field.onBlur}
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
                            rows={4}
                            value={(field.value as string) ?? ''}
                            onChange={({ value: next }) =>
                                field.onChange(next ?? '')
                            }
                            onBlur={field.onBlur}
                            error={Boolean(fieldState.error)}
                            validationText={fieldState.error?.message}
                        />
                    )}
                />
                <dl className={classes.placeholders}>
                    {placeholderHelp().map(({ token, description }) => (
                        <React.Fragment key={token}>
                            <dt>
                                <code>{token}</code>
                            </dt>
                            <dd>{description}</dd>
                        </React.Fragment>
                    ))}
                </dl>
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
