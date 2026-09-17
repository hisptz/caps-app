import { useAlert, useDataMutation } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import {
    Button,
    IconCheckmarkCircle16,
    InputField,
    NoticeBox,
    Tag,
} from '@dhis2/ui'
import React from 'react'
import { Controller, useFormContext, useFormState } from 'react-hook-form'
import { ConnectionDiagram } from './ConnectionDiagram'
import classes from './SettingsPage.module.css'
import {
    buildCapsRouteCreatePayload,
    createRouteMutation,
    updateRouteMutation,
} from '@/capsApi/dhis2CapsRoute'
import shellClasses from '@/shared/components/ui/PageShell/PageShell.module.css'

type AlertShowProps = { text: string; error?: boolean; success?: boolean }

export function SettingsForm({
    refetch,
    loading,
    route,
}: {
    refetch(): Promise<unknown>
    route?: { id: string }
    loading: boolean
}) {
    const { show } = useAlert(
        ({ text }: AlertShowProps) => text,
        ({ error, success }: AlertShowProps) => ({
            error: Boolean(error),
            success: Boolean(success),
        })
    )

    const [createRoute] = useDataMutation(createRouteMutation)
    const [updateRoute] = useDataMutation(updateRouteMutation)

    const { handleSubmit, watch } = useFormContext()
    const { isSubmitting: saving, isDirty } = useFormState()

    const isConfigured = Boolean(route)
    const currentUrl = (watch('capsBackendUrl') as string | undefined) ?? ''

    const onSubmit = handleSubmit(async ({ capsBackendUrl }) => {
        const trimmed = capsBackendUrl.trim()
        const payload = buildCapsRouteCreatePayload(trimmed)

        try {
            if (route) {
                await updateRoute({
                    id: route.id,
                    data: { ...payload },
                })
            } else {
                await createRoute({ data: payload })
            }
            show({ text: i18n.t('CAPS route saved.'), success: true })
            await refetch()
        } catch (e: unknown) {
            const msg =
                e && typeof e === 'object' && 'message' in e
                    ? String((e as { message: unknown }).message)
                    : i18n.t('Could not save route.')
            show({ text: msg, error: true })
        }
    })

    return (
        <div className={shellClasses.pageRoot}>
            <div className={classes.layout}>
                <header className={classes.pageHeader}>
                    <h1 className={classes.title}>{i18n.t('Settings')}</h1>
                    <p className={classes.lead}>
                        {i18n.t(
                            'Manage how this DHIS2 app connects to the CAPS monitoring service.'
                        )}
                    </p>
                </header>

                <form
                    id="settings-caps-route-form"
                    onSubmit={onSubmit}
                    aria-label={i18n.t('CAPS backend connection')}
                >
                    <div className={classes.cards}>
                        <section className={classes.card}>
                            <header className={classes.cardHeader}>
                                <div className={classes.cardHeaderText}>
                                    <h2 className={classes.cardTitle}>
                                        {i18n.t('Backend connection')}
                                    </h2>
                                    <p className={classes.cardSub}>
                                        {i18n.t(
                                            'The base URL of the CAPS API this app forwards requests to, via a DHIS2 route.'
                                        )}
                                    </p>
                                </div>
                                {isConfigured ? (
                                    <Tag
                                        positive
                                        icon={<IconCheckmarkCircle16 />}
                                    >
                                        {i18n.t('Connected')}
                                    </Tag>
                                ) : (
                                    <Tag neutral>
                                        {i18n.t('Not configured')}
                                    </Tag>
                                )}
                            </header>
                            <div className={classes.cardBody}>
                                <fieldset
                                    style={{
                                        margin: 0,
                                        padding: 0,
                                        border: 0,
                                        minWidth: 0,
                                    }}
                                >
                                    <legend className={classes.visuallyHidden}>
                                        {i18n.t('CAPS backend base URL')}
                                    </legend>
                                    <Controller
                                        name="capsBackendUrl"
                                        render={({ field, fieldState }) => (
                                            <InputField
                                                disabled={loading}
                                                label={i18n.t(
                                                    'CAPS backend base URL'
                                                )}
                                                helpText={i18n.t(
                                                    'Full URL of the CAPS service (scheme and host, no trailing slash). Example: https://caps.example.org'
                                                )}
                                                value={field.value}
                                                onChange={({ value }) =>
                                                    field.onChange(value)
                                                }
                                                placeholder="https://caps.example.org"
                                                type="url"
                                                name={field.name}
                                                required
                                                error={Boolean(
                                                    fieldState.error
                                                )}
                                                validationText={
                                                    fieldState.error?.message
                                                }
                                            />
                                        )}
                                    />
                                </fieldset>

                                {isConfigured && (
                                    <ConnectionDiagram
                                        currentUrl={currentUrl}
                                    />
                                )}
                            </div>
                            <footer className={classes.cardFooter}>
                                <Button
                                    primary
                                    type="submit"
                                    form="settings-caps-route-form"
                                    loading={saving}
                                    disabled={saving || loading || !isDirty}
                                >
                                    {isConfigured
                                        ? i18n.t('Save changes')
                                        : i18n.t('Save')}
                                </Button>
                            </footer>
                        </section>

                        {!isConfigured && (
                            <NoticeBox
                                className={classes.tipNotice}
                                title={i18n.t('First-time setup')}
                            >
                                {i18n.t(
                                    'Once the route is saved, CAPS pipelines and executions become available across the app.'
                                )}
                            </NoticeBox>
                        )}
                    </div>
                </form>
            </div>
        </div>
    )
}
