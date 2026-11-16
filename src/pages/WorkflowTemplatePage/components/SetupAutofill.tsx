import { useAlert, useDataEngine } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import { useEffect, useRef } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { useClimateCollectionsQuery } from '@/modules/climate-data/hooks/useClimateCollectionsQuery'
import { useInstanceQuery } from '@/modules/connected-instances/hooks/useInstanceMappings'
import type { TemplateFormValues } from '@/modules/workflows/schemas/templateFormSchema'
import {
    climateRowsFromSetup,
    dropPulledRows,
    pulledFromSetup,
} from '@/modules/workflows/utils/setupAutofill'
import { usePredictionSetupQuery } from '@/shared/hooks/useEvaluationsQuery'

/**
 * Fills the climate rows and the disease data to pull from the inputs of the chosen
 * prediction setup, so the workflow fetches what the model was evaluated on. Runs when the
 * user picks a setup or an instance; what they already filled stays.
 */
export function SetupAutofill(): null {
    const engine = useDataEngine()
    const { control, getValues, setValue, formState } =
        useFormContext<TemplateFormValues>()
    const setupId = useWatch({ control, name: 'predictionSetupId' })
    const source = useWatch({ control, name: 'diseaseSource' })
    const routeCode = useWatch({ control, name: 'routeCode' })
    const route = source === 'instance' && routeCode ? routeCode : ''

    const setupQuery = usePredictionSetupQuery(
        engine,
        setupId ? Number(setupId) : undefined
    )
    const collections = useClimateCollectionsQuery(engine)
    const instance = useInstanceQuery(engine, route || undefined)
    const { show } = useAlert(
        ({ message }) => message,
        () => ({ info: true, duration: 6000 })
    )
    const done = useRef<string | null>(null)

    const setup = setupQuery.data?.setup
    useEffect(() => {
        if (!setup || String(setup.id) !== setupId) {
            return
        }
        // The setup and instance the form was loaded with are already filled in
        const loaded = formState.defaultValues
        if (
            setupId === loaded?.predictionSetupId &&
            routeCode === loaded?.routeCode
        ) {
            return
        }
        if (collections.isLoading || (route && instance.isLoading)) {
            return
        }
        const key = `${setupId}|${route}`
        if (done.current === key) {
            return
        }
        done.current = key

        const pulled = new Set(
            route
                ? (instance.data?.mappings ?? [])
                      .filter((m) => m.direction === 'PULL')
                      .map((m) => m.stagingDataElement)
                : []
        )
        const before = getValues('climate')
        const climate = dropPulledRows(
            climateRowsFromSetup(before, setup.covariateSources, {
                datasets: collections.data ?? [],
                periodType: getValues('periodType'),
                pulled,
            }),
            pulled
        )
        const mappedBefore = getValues('diseaseMapped')
        const mapped = pulledFromSetup(
            mappedBefore,
            setup.covariateSources,
            pulled
        )
        const climateChanged =
            JSON.stringify(climate) !== JSON.stringify(before)
        if (climateChanged) {
            setValue('climate', climate, { shouldDirty: true })
        }
        if (mapped.length !== mappedBefore.length) {
            setValue('diseaseMapped', mapped, { shouldDirty: true })
        }
        if (climateChanged || mapped.length !== mappedBefore.length) {
            show({
                message: i18n.t(
                    'Filled in from the inputs of "{{name}}". Check the datasets before saving.',
                    { name: setup.name }
                ),
            })
        }
    }, [
        setup,
        setupId,
        routeCode,
        route,
        collections.isLoading,
        collections.data,
        instance.isLoading,
        instance.data,
        formState.defaultValues,
        getValues,
        setValue,
        show,
    ])

    return null
}
