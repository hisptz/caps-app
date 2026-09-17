import { useAlert, useDataMutation } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import { Button, Divider, InputField } from '@dhis2/ui'
import { zodResolver } from '@hookform/resolvers/zod'
import React from 'react'
import { Controller, FormProvider, useForm } from 'react-hook-form'
import classes from './WelcomePage.module.css'
import {
    buildCapsRouteCreatePayload,
    capsBackendUrlFormSchema,
    createRouteMutation,
    type CapsBackendUrlFormValues,
} from '@/capsApi/dhis2CapsRoute'

const lazyMutationOptions = { lazy: true as const }

type AlertShowProps = { text: string; error?: boolean; success?: boolean }

export type WelcomePageProps = {
    onRouteCreated: () => void | Promise<void>
}

const WelcomePage: React.FC<WelcomePageProps> = ({ onRouteCreated }) => {
    const { show } = useAlert(
        ({ text }: AlertShowProps) => text,
        ({ error, success }: AlertShowProps) => ({
            error: Boolean(error),
            success: Boolean(success),
        })
    )

    const [createRoute, { loading: creating }] = useDataMutation(
        createRouteMutation,
        lazyMutationOptions
    )

    const form = useForm<CapsBackendUrlFormValues>({
        defaultValues: {
            capsBackendUrl: '',
        },
        resolver: zodResolver(capsBackendUrlFormSchema),
    })

    const onSubmit = async ({ capsBackendUrl }: CapsBackendUrlFormValues) => {
        const trimmed = capsBackendUrl.trim()
        const payload = buildCapsRouteCreatePayload(trimmed)

        try {
            await createRoute({ data: payload })
            show({ text: i18n.t('CAPS route saved.'), success: true })
            await onRouteCreated()
        } catch (e: unknown) {
            const msg =
                e && typeof e === 'object' && 'message' in e
                    ? String((e as { message: unknown }).message)
                    : i18n.t('Could not save route.')
            show({ text: msg, error: true })
        }
    }

    return (
        <div className={classes.layout}>
            <header className={classes.pageHeader}>
                <h1 className={classes.title}>{i18n.t('Welcome to CAPS')}</h1>
                <p className={classes.lead}>
                    {i18n.t(
                        'Climate Automation & Prediction Scheduler (CAPS) is the operational face of the CAPS platform in DHIS2.'
                    )}
                </p>
                <p className={classes.lead}>
                    {i18n.t(
                        'This application is a pipeline operations console for monitoring scheduled jobs, executions, failures, analytics, and dead-letter events.'
                    )}
                </p>
            </header>
            <FormProvider {...form}>
                <form
                    id="welcome-caps-url-form"
                    onSubmit={form.handleSubmit(onSubmit)}
                    aria-label={i18n.t('CAPS backend connection')}
                >
                    <fieldset className={classes.fieldset}>
                        <legend className={classes.visuallyHidden}>
                            {i18n.t('CAPS backend base URL')}
                        </legend>
                        <Controller
                            name="capsBackendUrl"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <InputField
                                    disabled={form.formState.isSubmitting}
                                    label={i18n.t('CAPS backend base URL')}
                                    helpText={i18n.t(
                                        'Full URL of the CAPS service (scheme and host, no trailing slash). Example: https://caps.example.org'
                                    )}
                                    value={field.value}
                                    onChange={({ value }) =>
                                        field.onChange(value ?? '')
                                    }
                                    placeholder="https://caps.example.org"
                                    type="url"
                                    name={field.name}
                                    required
                                    error={Boolean(fieldState.error)}
                                    validationText={fieldState.error?.message}
                                />
                            )}
                        />
                    </fieldset>

                    <Divider className={classes.divider} />

                    <div className={classes.actions}>
                        <Button
                            primary
                            type="submit"
                            form="welcome-caps-url-form"
                            loading={creating}
                            disabled={creating || form.formState.isSubmitting}
                        >
                            {i18n.t('Save and continue')}
                        </Button>
                    </div>
                </form>
            </FormProvider>
        </div>
    )
}

export default WelcomePage
