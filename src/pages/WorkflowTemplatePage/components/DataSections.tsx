import { useDataEngine } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import {
    Button,
    IconAdd16,
    IconDelete16,
    SingleSelectField,
    SingleSelectOption,
} from '@dhis2/ui'
import React from 'react'
import {
    Controller,
    useFieldArray,
    useFormContext,
    useWatch,
} from 'react-hook-form'
import classes from '../WorkflowTemplatePage.module.css'
import { useClimateCollectionsQuery } from '@/modules/climate-data/hooks/useClimateCollectionsQuery'
import { useInstanceQuery } from '@/modules/connected-instances/hooks/useInstanceMappings'
import { useSourceRoutesQuery } from '@/modules/connected-instances/hooks/useSourceRoutes'
import type { TemplateFormValues } from '@/modules/workflows/schemas/templateFormSchema'
import { DataElementSelector } from '@/shared/components/HandlerConfigForms/DataElementSelector'
import { MappedItemsField } from '@/shared/components/HandlerConfigForms/Dhis2InstancePullConfig/MappedItemsField'
import {
    FormSection,
    RadioCardGroup,
} from '@/shared/components/ui/FormPrimitives'

const AGGREGATIONS = [
    { value: 'mean', label: i18n.t('Average') },
    { value: 'sum', label: i18n.t('Total') },
    { value: 'min', label: i18n.t('Lowest') },
    { value: 'max', label: i18n.t('Highest') },
] as const

export function ClimateSection(): React.ReactElement {
    const engine = useDataEngine()
    const { control, formState } = useFormContext<TemplateFormValues>()
    const rows = useFieldArray({ control, name: 'climate' })
    const collections = useClimateCollectionsQuery(engine)
    const datasets = (collections.data ?? []).filter(
        (c) => c.periodType && c.periodType !== 'irregular'
    )
    const rowsError = formState.errors.climate?.root ?? formState.errors.climate

    return (
        <FormSection
            num={4}
            title={i18n.t('Climate data')}
            description={i18n.t('from Open Climate Service')}
        >
            {rows.fields.map((row, index) => (
                <div key={row.id} className={classes.row}>
                    <div className={classes.rowFields}>
                        <Controller
                            name={`climate.${index}.datasetId`}
                            control={control}
                            render={({ field, fieldState }) => (
                                <SingleSelectField
                                    label={i18n.t('Dataset')}
                                    filterable
                                    loading={collections.isLoading}
                                    selected={
                                        datasets.some(
                                            (d) => d.id === field.value
                                        ) || !field.value
                                            ? field.value || undefined
                                            : undefined
                                    }
                                    onChange={({ selected }) =>
                                        field.onChange(selected)
                                    }
                                    error={Boolean(fieldState.error)}
                                    validationText={
                                        fieldState.error?.message ??
                                        (field.value &&
                                        !collections.isLoading &&
                                        !datasets.some(
                                            (d) => d.id === field.value
                                        )
                                            ? i18n.t(
                                                  '"{{id}}" is not in Open Climate Service',
                                                  { id: field.value }
                                              )
                                            : undefined)
                                    }
                                    helpText={i18n.t(
                                        'Datasets ingested on the Climate data page'
                                    )}
                                >
                                    {datasets.map((d) => (
                                        <SingleSelectOption
                                            key={d.id}
                                            value={d.id}
                                            label={`${d.title} (${d.periodType})`}
                                        />
                                    ))}
                                </SingleSelectField>
                            )}
                        />
                        <DataElementSelector
                            name={`climate.${index}.dataElement`}
                            label={i18n.t('Into staging data element')}
                        />
                        <Controller
                            name={`climate.${index}.aggregation`}
                            control={control}
                            render={({ field }) => (
                                <SingleSelectField
                                    label={i18n.t('Over each org unit, take')}
                                    selected={field.value}
                                    onChange={({ selected }) =>
                                        field.onChange(selected)
                                    }
                                >
                                    {AGGREGATIONS.map((a) => (
                                        <SingleSelectOption
                                            key={a.value}
                                            value={a.value}
                                            label={a.label}
                                        />
                                    ))}
                                </SingleSelectField>
                            )}
                        />
                    </div>
                    <Button
                        small
                        secondary
                        icon={<IconDelete16 />}
                        disabled={rows.fields.length === 1}
                        onClick={() => rows.remove(index)}
                        aria-label={i18n.t('Remove')}
                    />
                </div>
            ))}
            {rowsError?.message && (
                <p className={classes.fieldError}>{rowsError.message}</p>
            )}
            <div>
                <Button
                    small
                    icon={<IconAdd16 />}
                    onClick={() =>
                        rows.append({
                            datasetId: '',
                            dataElement: '',
                            aggregation: 'mean',
                        })
                    }
                >
                    {i18n.t('Add climate variable')}
                </Button>
            </div>
        </FormSection>
    )
}

/** Disease cases: already in staging, or pulled from another instance first. */
export function DiseaseSection(): React.ReactElement {
    const { control, setValue } = useFormContext<TemplateFormValues>()
    const source = useWatch({ control, name: 'diseaseSource' })
    const routeCode = useWatch({ control, name: 'routeCode' })
    const routes = useSourceRoutesQuery()
    const engine = useDataEngine()
    const instanceQuery = useInstanceQuery(engine, routeCode || undefined)

    return (
        <FormSection num={5} title={i18n.t('Disease data')}>
            <Controller
                name="diseaseSource"
                control={control}
                render={({ field }) => (
                    <RadioCardGroup
                        name="diseaseSource"
                        value={field.value}
                        onChange={field.onChange}
                        options={[
                            {
                                value: 'staging',
                                title: i18n.t('Already in staging'),
                                description: i18n.t(
                                    'Entered or imported here some other way'
                                ),
                            },
                            {
                                value: 'instance',
                                title: i18n.t('Pull from another instance'),
                                description: i18n.t(
                                    'e.g. the HMIS; pulled at the same time as the climate data'
                                ),
                            },
                        ]}
                    />
                )}
            />
            {source === 'instance' && (
                <>
                    <Controller
                        name="routeCode"
                        control={control}
                        render={({ field, fieldState }) => (
                            <SingleSelectField
                                label={i18n.t('Instance')}
                                loading={routes.isLoading}
                                selected={
                                    (routes.data ?? []).some(
                                        (r) => r.code === field.value
                                    )
                                        ? field.value
                                        : undefined
                                }
                                onChange={({ selected }) => {
                                    field.onChange(selected)
                                    // Picks belong to the old instance's mappings
                                    setValue('diseaseMapped', [])
                                }}
                                error={Boolean(fieldState.error)}
                                validationText={fieldState.error?.message}
                                helpText={i18n.t(
                                    'Connected on the Settings page'
                                )}
                            >
                                {(routes.data ?? []).map((r) => (
                                    <SingleSelectOption
                                        key={r.code}
                                        value={r.code}
                                        label={r.name}
                                    />
                                ))}
                            </SingleSelectField>
                        )}
                    />
                    {routeCode && (
                        <MappedItemsField
                            name="diseaseMapped"
                            routeCode={routeCode}
                            instance={instanceQuery.data}
                            loading={instanceQuery.isLoading}
                            direction="PULL"
                        />
                    )}
                </>
            )}
        </FormSection>
    )
}
