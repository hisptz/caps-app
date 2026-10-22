import i18n from '@dhis2/d2-i18n'
import { NoticeBox, SingleSelectField, SingleSelectOption } from '@dhis2/ui'
import React, { useMemo } from 'react'
import { Controller, useFormContext, useWatch } from 'react-hook-form'
import { useSourceRoutesQuery } from '@/modules/connected-instances/hooks/useSourceRoutes'
import { baseUrlFromRouteUrl } from '@/modules/connected-instances/schemas/routeForm'
import type { PipelineStepFormWithHandlerValues } from '@/modules/pipeline-detail/schemas/stepFormSchema'
import { FormSection } from '@/shared/components/ui/FormPrimitives'

/** Picks the connected instance (DHIS2 route) a step reads from or writes to: `handlerConfig.routeCode`. */
export function ConnectedInstanceSection({
    title,
    description,
    noInstancesText,
}: {
    title: string
    description: string
    /** Shown when no instance is connected yet. */
    noInstancesText: string
}): React.ReactElement {
    const { control } = useFormContext<PipelineStepFormWithHandlerValues>()
    const routesQuery = useSourceRoutesQuery()
    const routeCode = useWatch({ control, name: 'handlerConfig.routeCode' }) as
        | string
        | undefined

    const routes = routesQuery.data ?? []
    const selectedRoute = routes.find((r) => r.code === routeCode)
    const routeOptions = useMemo(() => {
        const options = routes.map((r) => ({ value: r.code, label: r.name }))
        if (routeCode && !routes.some((r) => r.code === routeCode)) {
            options.unshift({ value: routeCode, label: routeCode })
        }
        return options
    }, [routes, routeCode])

    return (
        <FormSection title={title} description={description} tight>
            {routesQuery.isSuccess && routes.length === 0 ? (
                <NoticeBox warning title={i18n.t('No connected instances')}>
                    {noInstancesText}
                </NoticeBox>
            ) : (
                <Controller
                    name="handlerConfig.routeCode"
                    control={control}
                    render={({ field, fieldState }) => (
                        <SingleSelectField
                            label={i18n.t('Instance')}
                            required
                            loading={routesQuery.isLoading}
                            selected={
                                field.value ? String(field.value) : undefined
                            }
                            onChange={({ selected }) =>
                                field.onChange(selected)
                            }
                            helpText={
                                selectedRoute
                                    ? baseUrlFromRouteUrl(selectedRoute.url)
                                    : undefined
                            }
                            error={
                                Boolean(fieldState.error) || routesQuery.isError
                            }
                            validationText={
                                routesQuery.isError
                                    ? i18n.t(
                                          'Could not load connected instances'
                                      )
                                    : fieldState.error?.message
                            }
                        >
                            {routeOptions.map((option) => (
                                <SingleSelectOption
                                    key={option.value}
                                    value={option.value}
                                    label={option.label}
                                />
                            ))}
                        </SingleSelectField>
                    )}
                />
            )}
            {routeCode && !selectedRoute && routesQuery.isSuccess && (
                <NoticeBox error title={i18n.t('Instance not found')}>
                    {i18n.t(
                        'The route {{code}} no longer exists on the destination. Pick another instance.',
                        { code: routeCode }
                    )}
                </NoticeBox>
            )}
        </FormSection>
    )
}
