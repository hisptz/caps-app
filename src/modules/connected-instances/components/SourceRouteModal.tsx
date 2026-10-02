import i18n from '@dhis2/d2-i18n'
import {
    Button,
    ButtonStrip,
    Checkbox,
    IconAdd16,
    IconDelete16,
    InputField,
    Modal,
    ModalActions,
    ModalContent,
    ModalTitle,
    NoticeBox,
} from '@dhis2/ui'
import { zodResolver } from '@hookform/resolvers/zod'
import React, { useEffect } from 'react'
import {
    Controller,
    FormProvider,
    useFieldArray,
    useForm,
    useWatch,
} from 'react-hook-form'
import classes from './ConnectedInstances.module.css'
import { SOURCE_ROUTE_CODE_PREFIX } from '@/modules/connected-instances/constants'
import { useSaveSourceRoute } from '@/modules/connected-instances/hooks/useSourceRoutes'
import {
    defaultSourceRouteFormValues,
    MAX_ROUTE_TIMEOUT_SECONDS,
    type SourceRoute,
    type SourceRouteAuthType,
    sourceRouteFormSchema,
    type SourceRouteFormValues,
    sourceRouteToFormValues,
} from '@/modules/connected-instances/schemas/routeForm'
import { dhis2ErrorMessage } from '@/modules/connected-instances/utils/dhis2ErrorMessage'
import {
    FormSection,
    SegmentedControl,
} from '@/shared/components/ui/FormPrimitives'

const FORM_ID = 'source-route-form'

const AUTH_OPTIONS: Array<{ value: SourceRouteAuthType; label: string }> = [
    { value: 'api-token', label: i18n.t('Access token') },
    { value: 'http-basic', label: i18n.t('Username and password') },
    { value: 'api-headers', label: i18n.t('Custom headers') },
]

type Props = {
    open: boolean
    route?: SourceRoute
    onClose: () => void
    onSaved: (name: string) => void
}

export function SourceRouteModal({
    open,
    route,
    onClose,
    onSaved,
}: Props): React.ReactElement | null {
    const saveMutation = useSaveSourceRoute()
    const form = useForm<SourceRouteFormValues>({
        resolver: zodResolver(sourceRouteFormSchema),
        defaultValues: defaultSourceRouteFormValues(),
        mode: 'onBlur',
    })
    const headers = useFieldArray({ control: form.control, name: 'headers' })
    const isEdit = Boolean(route)
    const [authType, changeCredentials, key] = useWatch({
        control: form.control,
        name: ['authType', 'changeCredentials', 'key'],
    })
    const rootError = form.formState.errors.root?.message
    const headersError = form.formState.errors.headers?.message

    useEffect(() => {
        if (open) {
            form.reset(
                route
                    ? sourceRouteToFormValues(route)
                    : defaultSourceRouteFormValues()
            )
            form.clearErrors()
        }
    }, [open, route, form])

    function onSubmit(values: SourceRouteFormValues) {
        saveMutation.mutate(values, {
            onSuccess: () => {
                onSaved(values.name.trim())
                onClose()
            },
            onError: (err) => {
                form.setError('root', {
                    type: 'server',
                    message: dhis2ErrorMessage(
                        err,
                        i18n.t('Could not save the connected instance.')
                    ),
                })
            },
        })
    }

    if (!open) {
        return null
    }

    return (
        <Modal large onClose={onClose} position="middle">
            <ModalTitle>
                {isEdit
                    ? i18n.t('Edit connected instance')
                    : i18n.t('Connect a DHIS2 instance')}
            </ModalTitle>
            <ModalContent>
                <FormProvider {...form}>
                    <form
                        id={FORM_ID}
                        className={classes.modalBody}
                        onSubmit={form.handleSubmit(onSubmit)}
                        noValidate
                    >
                        {rootError && (
                            <NoticeBox error title={i18n.t('Could not save')}>
                                {rootError}
                            </NoticeBox>
                        )}
                        <FormSection
                            title={i18n.t('Instance')}
                            description={i18n.t(
                                'Staging DHIS2 stores this as a route. CAPS reaches the instance through it, so the credentials never leave staging.'
                            )}
                        >
                            <div className={classes.row2}>
                                <Controller
                                    name="name"
                                    render={({ field, fieldState }) => (
                                        <InputField
                                            label={i18n.t('Name')}
                                            required
                                            placeholder={i18n.t(
                                                'e.g. DHIS2 Play'
                                            )}
                                            value={field.value ?? ''}
                                            onChange={({ value }) =>
                                                field.onChange(value)
                                            }
                                            onBlur={field.onBlur}
                                            error={Boolean(fieldState.error)}
                                            validationText={
                                                fieldState.error?.message
                                            }
                                        />
                                    )}
                                />
                                <Controller
                                    name="key"
                                    render={({ field, fieldState }) => (
                                        <InputField
                                            label={i18n.t('Route code')}
                                            required
                                            disabled={isEdit}
                                            placeholder="play"
                                            helpText={
                                                isEdit
                                                    ? i18n.t(
                                                          'Pipeline steps refer to the code, so it can’t change.'
                                                      )
                                                    : i18n.t(
                                                          'Saved as {{code}}. Pipeline steps refer to it, so it can’t change later.',
                                                          {
                                                              code: `${SOURCE_ROUTE_CODE_PREFIX}${key || '…'}`,
                                                          }
                                                      )
                                            }
                                            value={field.value ?? ''}
                                            onChange={({ value }) =>
                                                field.onChange(
                                                    (value ?? '').toLowerCase()
                                                )
                                            }
                                            onBlur={field.onBlur}
                                            error={Boolean(fieldState.error)}
                                            validationText={
                                                fieldState.error?.message
                                            }
                                        />
                                    )}
                                />
                            </div>
                            <Controller
                                name="baseUrl"
                                render={({ field, fieldState }) => (
                                    <InputField
                                        label={i18n.t('Instance URL')}
                                        required
                                        type="url"
                                        placeholder="https://play.im.dhis2.org/dev"
                                        helpText={i18n.t(
                                            'The address you open DHIS2 at, without /api.'
                                        )}
                                        value={field.value ?? ''}
                                        onChange={({ value }) =>
                                            field.onChange(value)
                                        }
                                        onBlur={field.onBlur}
                                        error={Boolean(fieldState.error)}
                                        validationText={
                                            fieldState.error?.message
                                        }
                                    />
                                )}
                            />
                        </FormSection>

                        <FormSection
                            title={i18n.t('Credentials')}
                            description={i18n.t(
                                'Use a read-only account on the instance. The route forwards any API call with these credentials, including writes.'
                            )}
                        >
                            {isEdit && (
                                <Controller
                                    name="changeCredentials"
                                    render={({ field }) => (
                                        <Checkbox
                                            label={i18n.t(
                                                'Replace the stored credentials'
                                            )}
                                            checked={Boolean(field.value)}
                                            onChange={({ checked }) =>
                                                field.onChange(checked)
                                            }
                                        />
                                    )}
                                />
                            )}
                            {changeCredentials && (
                                <>
                                    <Controller
                                        name="authType"
                                        render={({ field }) => (
                                            <SegmentedControl
                                                name="source-route-auth-type"
                                                value={field.value}
                                                options={AUTH_OPTIONS}
                                                onChange={field.onChange}
                                                aria-label={i18n.t(
                                                    'Authentication'
                                                )}
                                            />
                                        )}
                                    />
                                    {authType === 'api-token' && (
                                        <Controller
                                            name="token"
                                            render={({ field, fieldState }) => (
                                                <InputField
                                                    label={i18n.t(
                                                        'Personal access token'
                                                    )}
                                                    type="password"
                                                    autoComplete="off"
                                                    placeholder="d2p_…"
                                                    helpText={i18n.t(
                                                        'Recommended. Create it on the instance under Profile › Personal access tokens.'
                                                    )}
                                                    value={field.value ?? ''}
                                                    onChange={({ value }) =>
                                                        field.onChange(value)
                                                    }
                                                    onBlur={field.onBlur}
                                                    error={Boolean(
                                                        fieldState.error
                                                    )}
                                                    validationText={
                                                        fieldState.error
                                                            ?.message
                                                    }
                                                />
                                            )}
                                        />
                                    )}
                                    {authType === 'http-basic' && (
                                        <div className={classes.row2}>
                                            <Controller
                                                name="username"
                                                render={({
                                                    field,
                                                    fieldState,
                                                }) => (
                                                    <InputField
                                                        label={i18n.t(
                                                            'Username'
                                                        )}
                                                        autoComplete="off"
                                                        value={
                                                            field.value ?? ''
                                                        }
                                                        onChange={({ value }) =>
                                                            field.onChange(
                                                                value
                                                            )
                                                        }
                                                        onBlur={field.onBlur}
                                                        error={Boolean(
                                                            fieldState.error
                                                        )}
                                                        validationText={
                                                            fieldState.error
                                                                ?.message
                                                        }
                                                    />
                                                )}
                                            />
                                            <Controller
                                                name="password"
                                                render={({
                                                    field,
                                                    fieldState,
                                                }) => (
                                                    <InputField
                                                        label={i18n.t(
                                                            'Password'
                                                        )}
                                                        type="password"
                                                        autoComplete="new-password"
                                                        value={
                                                            field.value ?? ''
                                                        }
                                                        onChange={({ value }) =>
                                                            field.onChange(
                                                                value
                                                            )
                                                        }
                                                        onBlur={field.onBlur}
                                                        error={Boolean(
                                                            fieldState.error
                                                        )}
                                                        validationText={
                                                            fieldState.error
                                                                ?.message
                                                        }
                                                    />
                                                )}
                                            />
                                        </div>
                                    )}
                                    {authType === 'api-headers' && (
                                        <div className={classes.headerList}>
                                            {headers.fields.map(
                                                (row, index) => (
                                                    <div
                                                        key={row.id}
                                                        className={
                                                            classes.headerRow
                                                        }
                                                    >
                                                        <Controller
                                                            name={`headers.${index}.name`}
                                                            render={({
                                                                field,
                                                            }) => (
                                                                <InputField
                                                                    dense
                                                                    label={
                                                                        index ===
                                                                        0
                                                                            ? i18n.t(
                                                                                  'Header'
                                                                              )
                                                                            : undefined
                                                                    }
                                                                    placeholder="X-API-Key"
                                                                    value={
                                                                        field.value ??
                                                                        ''
                                                                    }
                                                                    onChange={({
                                                                        value,
                                                                    }) =>
                                                                        field.onChange(
                                                                            value
                                                                        )
                                                                    }
                                                                />
                                                            )}
                                                        />
                                                        <Controller
                                                            name={`headers.${index}.value`}
                                                            render={({
                                                                field,
                                                            }) => (
                                                                <InputField
                                                                    dense
                                                                    type="password"
                                                                    autoComplete="off"
                                                                    label={
                                                                        index ===
                                                                        0
                                                                            ? i18n.t(
                                                                                  'Value'
                                                                              )
                                                                            : undefined
                                                                    }
                                                                    value={
                                                                        field.value ??
                                                                        ''
                                                                    }
                                                                    onChange={({
                                                                        value,
                                                                    }) =>
                                                                        field.onChange(
                                                                            value
                                                                        )
                                                                    }
                                                                />
                                                            )}
                                                        />
                                                        <Button
                                                            small
                                                            secondary
                                                            type="button"
                                                            icon={
                                                                <IconDelete16 />
                                                            }
                                                            aria-label={i18n.t(
                                                                'Remove header'
                                                            )}
                                                            disabled={
                                                                headers.fields
                                                                    .length ===
                                                                1
                                                            }
                                                            onClick={() =>
                                                                headers.remove(
                                                                    index
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                )
                                            )}
                                            <div>
                                                <Button
                                                    small
                                                    secondary
                                                    type="button"
                                                    icon={<IconAdd16 />}
                                                    onClick={() =>
                                                        headers.append({
                                                            name: '',
                                                            value: '',
                                                        })
                                                    }
                                                >
                                                    {i18n.t('Add header')}
                                                </Button>
                                            </div>
                                            {headersError && (
                                                <p
                                                    className={
                                                        classes.fieldError
                                                    }
                                                >
                                                    {headersError}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </FormSection>

                        <FormSection title={i18n.t('Access and limits')} tight>
                            <Controller
                                name="authorities"
                                render={({ field }) => (
                                    <InputField
                                        label={i18n.t('Authorities')}
                                        placeholder="F_CAPS_SOURCE_ROUTES"
                                        helpText={i18n.t(
                                            'Comma-separated. Only users with one of these authorities can run the route. Give one to CAPS admins and the CAPS engine user.'
                                        )}
                                        value={field.value ?? ''}
                                        onChange={({ value }) =>
                                            field.onChange(value)
                                        }
                                    />
                                )}
                            />
                            <Controller
                                name="responseTimeoutSeconds"
                                render={({ field, fieldState }) => (
                                    <InputField
                                        label={i18n.t(
                                            'Response timeout (seconds)'
                                        )}
                                        type="number"
                                        min="1"
                                        max={String(MAX_ROUTE_TIMEOUT_SECONDS)}
                                        inputWidth="120px"
                                        helpText={i18n.t(
                                            'How long staging waits for the instance. Analytics calls can be slow, so keep this high.'
                                        )}
                                        value={
                                            Number.isFinite(field.value)
                                                ? String(field.value)
                                                : ''
                                        }
                                        onChange={({ value }) =>
                                            field.onChange(
                                                value === ''
                                                    ? NaN
                                                    : Number(value)
                                            )
                                        }
                                        onBlur={field.onBlur}
                                        error={Boolean(fieldState.error)}
                                        validationText={
                                            fieldState.error?.message
                                        }
                                    />
                                )}
                            />
                        </FormSection>
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
                        form={FORM_ID}
                        loading={saveMutation.isPending}
                    >
                        {saveMutation.isPending
                            ? i18n.t('Saving…')
                            : isEdit
                              ? i18n.t('Save changes')
                              : i18n.t('Connect instance')}
                    </Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    )
}
