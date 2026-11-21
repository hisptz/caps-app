import { useDataEngine } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import { Button, IconAdd16, InputField, NoticeBox } from '@dhis2/ui'
import React, { useEffect, useState } from 'react'
import {
    Controller,
    useFieldArray,
    useFormContext,
    useWatch,
} from 'react-hook-form'
import { ConnectedInstanceSection } from '../ConnectedInstanceSection'
import { OrganisationUnitConfigSection } from '../OrganisationUnitConfigSection'
import classes from './Dhis2InstancePullConfig.module.css'
import { MappedItemsField } from './MappedItemsField'
import { PullPeriodFields } from './PullPeriodFields'
import { SourceItemRow } from './SourceItemRow'
import { useInstanceQuery } from '@/modules/connected-instances/hooks/useInstanceMappings'
import {
    useSourceDataElementCombos,
    useSourceDataItemsById,
    useStagingDataElements,
} from '@/modules/dhis2-instance-pull/hooks/usePullItemQueries'
import {
    defaultDhis2InstancePullConfig,
    isDhis2InstancePullConfigShape,
    type OrgUnitMatch,
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
    const { control, getValues, setValue } =
        useFormContext<PipelineStepFormWithHandlerValues>()
    const [showAdvanced, setShowAdvanced] = useState(false)

    useEffect(() => {
        const raw = getValues('handlerConfig') ?? value
        if (!isDhis2InstancePullConfigShape(raw)) {
            const defaults = defaultDhis2InstancePullConfig()
            setValue('handlerConfig', defaults, { shouldDirty: false })
            onChange(defaults)
        }
    }, [getValues, onChange, setValue, value])

    // A step that picks from the instance's mappings has no `items`. Steps saved while an empty
    // field array was written into the form may carry `items: []` next to `mapped`; drop it.
    useEffect(() => {
        const raw = getValues('handlerConfig') as Record<string, unknown> | null
        if (raw && Array.isArray(raw.mapped) && Array.isArray(raw.items)) {
            const rest = { ...raw }
            delete rest.items
            setValue('handlerConfig', rest, { shouldDirty: false })
            onChange(rest)
        }
    }, [getValues, onChange, setValue, value])

    const routeCode = useWatch({ control, name: 'handlerConfig.routeCode' }) as
        | string
        | undefined
    const watchedItems = useWatch({ control, name: 'handlerConfig.items' }) as
        | PullItem[]
        | undefined
    const items = watchedItems ?? EMPTY_ITEMS
    const watchedMapped = useWatch({ control, name: 'handlerConfig.mapped' })
    // Older steps list their own items; the rest pick from the instance's mappings.
    const legacy = Array.isArray(watchedItems) && !Array.isArray(watchedMapped)
    const engine = useDataEngine()
    const instanceQuery = useInstanceQuery(engine, routeCode || undefined)
    const instance = instanceQuery.data
    const stepOrgUnitMatch = (useWatch({
        control,
        name: 'handlerConfig.orgUnitMatch',
    }) ?? 'id') as OrgUnitMatch
    const orgUnitMatch = instance?.configured
        ? instance.orgUnitMatch
        : stepOrgUnitMatch
    /** Drops the step's own items; it then picks from the instance's mappings. */
    function switchToMappings() {
        const config = { ...(getValues('handlerConfig') ?? {}) }
        delete config.items
        setValue(
            'handlerConfig',
            { ...config, mapped: [] },
            { shouldDirty: true }
        )
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <ConnectedInstanceSection
                title={i18n.t('Source instance')}
                description={i18n.t(
                    'The DHIS2 instance to pull from, connected in Settings.'
                )}
                noInstancesText={i18n.t(
                    'Connect the source instance under Settings › Connected instances first.'
                )}
            />

            {!legacy && (
                <FormSection
                    title={i18n.t('Data items')}
                    description={i18n.t(
                        'Pick what this step pulls from the instance’s mappings.'
                    )}
                    tight
                >
                    {routeCode ? (
                        <MappedItemsField
                            routeCode={routeCode}
                            instance={instance}
                            loading={instanceQuery.isLoading}
                            direction="PULL"
                        />
                    ) : (
                        <p className={classes.hint}>
                            {i18n.t('Pick a source instance first.')}
                        </p>
                    )}
                </FormSection>
            )}

            {legacy && (
                <LegacyItemsSection
                    routeCode={routeCode}
                    items={items}
                    onSwitchToMappings={switchToMappings}
                />
            )}

            <FormSection
                title={i18n.t('Organisation units')}
                description={
                    orgUnitMatch === 'code'
                        ? i18n.t(
                              'Chosen from the destination. Each is pulled from the source org unit with the same code; org units without a code are skipped.'
                          )
                        : i18n.t(
                              'Chosen from the destination. Each is pulled from the source org unit with the same ID.'
                          )
                }
                tight
            >
                <p className={classes.hint}>
                    {instance?.configured
                        ? orgUnitMatch === 'code'
                            ? i18n.t(
                                  'Matched on the source by code, as set for this instance under Settings › Connected instances.'
                              )
                            : i18n.t(
                                  'Matched on the source by ID, as set for this instance under Settings › Connected instances.'
                              )
                        : orgUnitMatch === 'code'
                          ? i18n.t(
                                'Matched on the source by code. Set how org units are matched for this instance under Settings › Connected instances.'
                            )
                          : i18n.t(
                                'Matched on the source by ID. Set how org units are matched for this instance under Settings › Connected instances.'
                            )}
                </p>
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

/**
 * Older steps list their own items. Kept in its own component so its field array only exists
 * for those steps: mounting `useFieldArray` writes an empty `items` into a config that has
 * none, which would turn a step that picks from the instance's mappings into one listing none.
 */
function LegacyItemsSection({
    routeCode,
    items,
    onSwitchToMappings,
}: {
    routeCode: string | undefined
    items: PullItem[]
    onSwitchToMappings: () => void
}): React.ReactElement {
    const { control, formState } =
        useFormContext<PipelineStepFormWithHandlerValues>()
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

    const itemsError = (
        formState.errors.handlerConfig as
            | { items?: { message?: string } }
            | undefined
    )?.items?.message

    return (
        <FormSection
            title={i18n.t('Data items')}
            description={i18n.t(
                'Each item is written to the destination data element with the same ID.'
            )}
            tight
        >
            <NoticeBox title={i18n.t('This step lists its own items')}>
                <p>
                    {i18n.t(
                        'Data items now belong to the connected instance. Map them under Settings › Connected instances › Mappings, then switch this step to pick from them.'
                    )}
                </p>
                <Button small onClick={onSwitchToMappings}>
                    {i18n.t('Use instance mappings')}
                </Button>
            </NoticeBox>
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
                                    ? sourceItems.data?.get(items[index].from)
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
                                          items[index].into ?? items[index].from
                                      )?.combo
                                    : undefined
                            }
                            sourceCombo={
                                items[index]?.from
                                    ? sourceCombos.data?.get(items[index].from)
                                          ?.combo
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
    )
}
