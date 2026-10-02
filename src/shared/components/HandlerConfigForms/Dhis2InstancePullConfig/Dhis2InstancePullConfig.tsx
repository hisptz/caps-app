import i18n from '@dhis2/d2-i18n'
import {
    Button,
    IconAdd16,
    InputField,
    NoticeBox,
    SingleSelectField,
    SingleSelectOption,
} from '@dhis2/ui'
import React, { useEffect, useMemo, useState } from 'react'
import {
    Controller,
    useFieldArray,
    useFormContext,
    useWatch,
} from 'react-hook-form'
import { OrganisationUnitConfigSection } from '../OrganisationUnitConfigSection'
import classes from './Dhis2InstancePullConfig.module.css'
import { PullPeriodFields } from './PullPeriodFields'
import { SourceItemRow } from './SourceItemRow'
import { useSourceRoutesQuery } from '@/modules/connected-instances/hooks/useSourceRoutes'
import { baseUrlFromRouteUrl } from '@/modules/connected-instances/schemas/routeForm'
import {
    useSourceDataElementCombos,
    useSourceDataItemsById,
    useStagingDataElements,
} from '@/modules/dhis2-instance-pull/hooks/usePullItemQueries'
import {
    defaultDhis2InstancePullConfig,
    isDhis2InstancePullConfigShape,
    type PullItem,
} from '@/modules/dhis2-instance-pull/schemas/config'
import type { PipelineStepFormWithHandlerValues } from '@/modules/pipeline-detail/schemas/stepFormSchema'
import {
    FormSection,
    formSectionGrids,
} from '@/shared/components/ui/FormPrimitives'

export interface Dhis2InstancePullConfigProps {
    value: Record<string, unknown> | null
    onChange: (v: Record<string, unknown>) => void
}

const EMPTY_ITEMS: PullItem[] = []

export function Dhis2InstancePullConfig({
    value,
    onChange,
}: Dhis2InstancePullConfigProps): React.ReactElement {
    const { control, getValues, setValue, formState } =
        useFormContext<PipelineStepFormWithHandlerValues>()
    const [showAdvanced, setShowAdvanced] = useState(false)
    const routesQuery = useSourceRoutesQuery()

    useEffect(() => {
        const raw = getValues('handlerConfig') ?? value
        if (!isDhis2InstancePullConfigShape(raw)) {
            const defaults = defaultDhis2InstancePullConfig()
            setValue('handlerConfig', defaults, { shouldDirty: false })
            onChange(defaults)
        }
    }, [getValues, onChange, setValue, value])

    const routeCode = useWatch({ control, name: 'handlerConfig.routeCode' }) as
        | string
        | undefined
    const watchedItems = useWatch({ control, name: 'handlerConfig.items' }) as
        | PullItem[]
        | undefined
    const items = watchedItems ?? EMPTY_ITEMS
    const itemsArray = useFieldArray({
        control,
        // Typed loosely: handlerConfig is a record in the step form schema.
        name: 'handlerConfig.items' as never,
    })

    const sourceItems = useSourceDataItemsById(routeCode || undefined, items)
    const stagingIds = items.flatMap((item) =>
        item.into
            ? [item.into]
            : item.fromType === 'DATA_ELEMENT' && item.from
              ? [item.from]
              : []
    )
    const staging = useStagingDataElements(stagingIds)
    const stagingNames =
        stagingIds.length === 0
            ? new Map<string, string>()
            : staging.data &&
              new Map([...staging.data].map(([id, de]) => [id, de.name]))
    const sourceDataElementIds = items.flatMap((item) =>
        item.fromType === 'DATA_ELEMENT' && item.from ? [item.from] : []
    )
    const sourceCombos = useSourceDataElementCombos(
        routeCode || undefined,
        sourceDataElementIds
    )

    const routes = routesQuery.data ?? []
    const selectedRoute = routes.find((r) => r.code === routeCode)
    const routeOptions = useMemo(() => {
        const options = routes.map((r) => ({ value: r.code, label: r.name }))
        if (routeCode && !routes.some((r) => r.code === routeCode)) {
            options.unshift({ value: routeCode, label: routeCode })
        }
        return options
    }, [routes, routeCode])

    const itemsError = (
        formState.errors.handlerConfig as
            | { items?: { message?: string } }
            | undefined
    )?.items?.message

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <FormSection
                title={i18n.t('Source instance')}
                description={i18n.t(
                    'The DHIS2 instance to pull from, connected in Settings.'
                )}
                tight
            >
                {routesQuery.isSuccess && routes.length === 0 ? (
                    <NoticeBox warning title={i18n.t('No connected instances')}>
                        {i18n.t(
                            'Connect the source instance under Settings › Connected instances first.'
                        )}
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
                                    field.value
                                        ? String(field.value)
                                        : undefined
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
                                    Boolean(fieldState.error) ||
                                    routesQuery.isError
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

            <FormSection
                title={i18n.t('Data items')}
                description={i18n.t(
                    'Each item is written to the destination data element with the same ID.'
                )}
                tight
            >
                {staging.isError && (
                    <NoticeBox
                        warning
                        title={i18n.t('Could not check the destination')}
                    >
                        {i18n.t(
                            'Which items already exist on the destination is unknown; it’s checked again on save.'
                        )}
                    </NoticeBox>
                )}
                {items.length > 0 && (
                    <ul className={classes.items}>
                        {itemsArray.fields.map((row, index) => (
                            <SourceItemRow
                                key={row.id}
                                index={index}
                                routeCode={routeCode || undefined}
                                selected={
                                    items[index]?.from
                                        ? sourceItems.data?.get(
                                              items[index].from
                                          )
                                        : undefined
                                }
                                staging={stagingNames}
                                stagingPending={
                                    staging.isFetching &&
                                    (staging.isPreviousData || !staging.data)
                                }
                                sourcePending={
                                    sourceItems.isFetching ||
                                    sourceCombos.isFetching
                                }
                                stagingCombo={
                                    items[index]
                                        ? staging.data?.get(
                                              items[index].into ??
                                                  items[index].from
                                          )?.combo
                                        : undefined
                                }
                                sourceCombo={
                                    items[index]?.from
                                        ? sourceCombos.data?.get(
                                              items[index].from
                                          )?.combo
                                        : undefined
                                }
                                onRemove={() => itemsArray.remove(index)}
                            />
                        ))}
                    </ul>
                )}
                {itemsError && <NoticeBox error>{itemsError}</NoticeBox>}
                <div>
                    <Button
                        small
                        secondary
                        icon={<IconAdd16 />}
                        disabled={!routeCode}
                        onClick={() =>
                            itemsArray.append({
                                from: '',
                                fromType: 'DATA_ELEMENT',
                            } as never)
                        }
                    >
                        {i18n.t('Add item')}
                    </Button>
                </div>
            </FormSection>

            <FormSection
                title={i18n.t('Organisation units')}
                description={i18n.t(
                    'Chosen from the destination. They must have the same IDs on the source instance'
                )}
                tight
            >
                <OrganisationUnitConfigSection />
            </FormSection>

            <FormSection
                title={i18n.t('Periods')}
                description={i18n.t(
                    'Values are merged into the destination, so pulling a period again updates it.'
                )}
                tight
            >
                <PullPeriodFields name="handlerConfig.period" />
            </FormSection>

            <div>
                <Button
                    small
                    secondary
                    type="button"
                    onClick={() => setShowAdvanced((v) => !v)}
                    aria-expanded={showAdvanced}
                >
                    {showAdvanced
                        ? i18n.t('Hide advanced options')
                        : i18n.t('Show advanced options')}
                </Button>
            </div>
            {showAdvanced && (
                <FormSection
                    title={i18n.t('Request size')}
                    description={i18n.t(
                        'Each analytics request covers at most this many periods and org units. Lower them if requests time out.'
                    )}
                    tight
                >
                    <div className={formSectionGrids.grid2}>
                        {(
                            [
                                ['periods', i18n.t('Periods per request'), 60],
                                [
                                    'orgUnits',
                                    i18n.t('Org units per request'),
                                    500,
                                ],
                            ] as const
                        ).map(([key, label, max]) => (
                            <Controller
                                key={key}
                                name={`handlerConfig.chunk.${key}`}
                                control={control}
                                render={({ field, fieldState }) => (
                                    <InputField
                                        label={label}
                                        type="number"
                                        min="1"
                                        max={String(max)}
                                        inputWidth="120px"
                                        value={
                                            Number.isFinite(field.value)
                                                ? String(field.value)
                                                : ''
                                        }
                                        onChange={({ value: v }) =>
                                            field.onChange(
                                                v === '' ? undefined : Number(v)
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
                        ))}
                    </div>
                </FormSection>
            )}
        </div>
    )
}
