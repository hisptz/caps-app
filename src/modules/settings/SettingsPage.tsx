import { useDataQuery } from '@dhis2/app-runtime'
import { zodResolver } from '@hookform/resolvers/zod'
import React from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import {
    baseUrlForEdit,
    capsBackendUrlFormSchema,
    type CapsBackendUrlFormValues,
    routeListQuery,
    type RoutesListResponse,
} from '@/capsApi/dhis2CapsRoute'
import { SettingsForm } from '@/modules/settings/SettingsForm'

type RouteResponse = {
    routeList: RoutesListResponse
}

const SettingsPage = () => {
    const { refetch, loading, data } =
        useDataQuery<RouteResponse>(routeListQuery)
    const form = useForm<CapsBackendUrlFormValues>({
        defaultValues: async () => {
            const existing = (await refetch()) as RouteResponse | undefined
            if (!existing?.routeList.routes?.length) {
                return { capsBackendUrl: '' }
            }

            return {
                capsBackendUrl: baseUrlForEdit(
                    existing.routeList.routes[0].url
                ),
            }
        },
        resolver: zodResolver(capsBackendUrlFormSchema),
    })

    const firstRoute = data?.routeList.routes?.[0]

    return (
        <FormProvider {...form}>
            <SettingsForm
                route={firstRoute ? { id: firstRoute.id } : undefined}
                loading={loading}
                refetch={refetch}
            />
        </FormProvider>
    )
}

export default SettingsPage
