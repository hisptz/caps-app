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
import { ConfigLabeledControl } from '../ConfigLabeledControl'
import { ConnectedInstanceSection } from '../ConnectedInstanceSection'
import classes from '../Dhis2InstancePullConfig/Dhis2InstancePullConfig.module.css'
import { MappedItemsField } from '../Dhis2InstancePullConfig/MappedItemsField'
import { OrganisationUnitConfigSection } from '../OrganisationUnitConfigSection'
import { PushItemRow } from './PushItemRow'
import { PushPeriodFields } from './PushPeriodFields'
import { useInstanceQuery } from '@/modules/connected-instances/hooks/useInstanceMappings'
import { IMPORT_STRATEGY_OPTIONS } from '@/modules/dhis2-data-upload/constants'
import type { DataValueImportStrategy } from '@/modules/dhis2-data-upload/schemas/config'
import type { OrgUnitMatch } from '@/modules/dhis2-instance-pull/schemas/config'
import { usePushDataElements } from '@/modules/dhis2-instance-push/hooks/usePushItemQueries'
import {
    defaultDhis2InstancePushConfig,
    isDhis2InstancePushConfigShape,
    PUSH_CHUNK_MAX,
    PUSH_CHUNK_MIN,
    pushItemTarget,
    type PushItem,
    type PushPeriod,
    type PushSource,
} from '@/modules/dhis2-instance-push/schemas/config'
import type { PipelineStepFormWithHandlerValues } from '@/modules/pipeline-detail/schemas/stepFormSchema'
import {
    FormSection,
    formSectionGrids,
    RadioCardGroup,
    type RadioCardOption,
} from '@/shared/components/ui/FormPrimitives'

export interface Dhis2InstancePushConfigProps {
    value: Record<string, unknown> | null
    onChange: (v: Record<string, unknown>) => void
}

const EMPTY_ITEMS: Partial<PushItem>[] = []

const SOURCE_OPTIONS: ReadonlyArray<RadioCardOption<PushSource>> = [
    {
        value: 'raw',
        title: i18n.t('Raw data'),
        description: i18n.t(
            'Values exactly as entered at the selected org units'
        ),
    },
    {
        value: 'analytics',
        title: i18n.t('Analytics'),
        description: i18n.t(
            'Totals rolled up to the selected org units; run analytics first'
        ),
    },
    {
        value: 'previous',
        title: i18n.t('Previous step'),
        description: i18n.t(
            'Values the previous step pulled, e.g. DHIS2 Instance Pull; nothing is stored on staging'
        ),
    },
]

function sourceOrgUnitNote(source: PushSource): string {
    if (source === 'previous') {
        return i18n.t(
            'Optional: leave empty to send every org unit in the previous step’s values, or pick some to send only theirs.'
        )
    }
    return source === 'raw'
        ? i18n.t(
              'Raw data is read as stored at these org units; values at lower levels aren’t added up.'
          )
        : i18n.t('Values from lower levels are added up into these org units.')
}

export function Dhis2InstancePushConfig({
    value,
    onChange,
}: Dhis2InstancePushConfigProps): React.ReactElement {
    const { control, getValues, setValue } =
        useFormContext<PipelineStepFormWithHandlerValues>()
    const [showAdvanced, setShowAdvanced] = useState(false)

    useEffect(() => {
        const raw = getValues('handlerConfig') ?? value
        if (!isDhis2InstancePushConfigShape(raw)) {
            const defaults = defaultDhis2InstancePushConfig()
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
        | Partial<PushItem>[]
        | undefined
    const items = watchedItems ?? EMPTY_ITEMS
    const watchedMapped = useWatch({ control, name: 'handlerConfig.mapped' })
    // Older steps list their own items; the rest pick from the instance's mappings.
    const legacy = Array.isArray(watchedItems) && !Array.isArray(watchedMapped)
    const stepOrgUnitMatch = (useWatch({
        control,
        name: 'handlerConfig.orgUnitMatch',
    }) ?? 'id') as OrgUnitMatch
    const engine = useDataEngine()
    const instanceQuery = useInstanceQuery(engine, routeCode || undefined)
    const instance = instanceQuery.data
    // Once the instance has settings, its match is used for every step.
    const orgUnitMatch = instance?.configured
        ? instance.orgUnitMatch
        : stepOrgUnitMatch
    const source = (useWatch({ control, name: 'handlerConfig.source' }) ??
        'raw') as PushSource

    // Analytics can't be read by last update: move such a period to latest periods.
    // Reading staging needs a period, which a step that sent the previous step's values may lack.
    function switchSource(next: PushSource) {
        setValue('handlerConfig.source', next, { shouldDirty: true })
        const period = getValues('handlerConfig.period') as
            | PushPeriod
            | undefined
        if (next === 'raw' && !period) {
            setValue(
                'handlerConfig.period',
                { mode: 'updated', days: 7 },
                { shouldDirty: true, shouldValidate: true }
            )
        }
        if (next === 'analytics' && (!period || period.mode === 'updated')) {
            setValue(
                'handlerConfig.period',
                {
                    mode: 'relative',
                    periodType: 'MONTHLY',
                    count: 3,
                    offset: 1,
                },
                { shouldDirty: true, shouldValidate: true }
            )
        }
    }

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
                title={i18n.t('Target instance')}
                description={i18n.t(
                    'The DHIS2 instance to push to, connected in Settings. Its route needs permission to write data values there.'
                )}
                noInstancesText={i18n.t(
                    'Connect the target instance under Settings › Connected instances first.'
                )}
            />

            {!legacy && (
                <FormSection
                    title={i18n.t('Data elements')}
                    description={i18n.t(
                        'Pick what this step pushes from the instance’s mappings.'
                    )}
                    tight
                >
                    {routeCode ? (
                        <MappedItemsField
                            routeCode={routeCode}
                            instance={instance}
                            loading={instanceQuery.isLoading}
                            direction="PUSH"
                        />
                    ) : (
                        <p className={classes.hint}>
                            {i18n.t('Pick a target instance first.')}
                        </p>
                    )}
                </FormSection>
            )}

            {legacy && (
                <LegacyItemsSection
                    routeCode={routeCode}
                    items={items}
                    onSwitchToMappings={switchToMappings}
                    source={source}
                />
            )}

            <FormSection
                title={i18n.t('Organisation units')}
                description={
                    orgUnitMatch === 'code'
                        ? i18n.t(
                              'Chosen from staging. Each is sent to the target org unit with the same code; org units without a match are skipped.'
                          ) +
                          ' ' +
                          sourceOrgUnitNote(source)
                        : i18n.t(
                              'Chosen from staging. Each is sent to the target org unit with the same ID; org units without a match are skipped.'
                          ) +
                          ' ' +
                          sourceOrgUnitNote(source)
                }
                tight
            >
                <p className={classes.hint}>
                    {instance?.configured
                        ? orgUnitMatch === 'code'
                            ? i18n.t(
                                  'Matched on the target by code, as set for this instance under Settings › Connected instances.'
                              )
                            : i18n.t(
                                  'Matched on the target by ID, as set for this instance under Settings › Connected instances.'
                              )
                        : orgUnitMatch === 'code'
                          ? i18n.t(
                                'Matched on the target by code. Set how org units are matched for this instance under Settings › Connected instances.'
                            )
                          : i18n.t(
                                'Matched on the target by ID. Set how org units are matched for this instance under Settings › Connected instances.'
                            )}
                </p>
                <OrganisationUnitConfigSection />
            </FormSection>

            <FormSection
                title={i18n.t('Data to push')}
                description={i18n.t(
                    'Values are merged into the target by default, so sending a value again updates it.'
                )}
                tight
            >
                <Controller
                    name="handlerConfig.source"
                    control={control}
                    render={({ field }) => (
                        <ConfigLabeledControl
                            label={i18n.t('Read values from')}
                        >
                            <RadioCardGroup<PushSource>
                                name="dhis2-instance-push-source"
                                value={(field.value as PushSource) ?? 'raw'}
                                onChange={switchSource}
                                options={SOURCE_OPTIONS}
                                columns={3}
                            />
                        </ConfigLabeledControl>
                    )}
                />
                {source === 'previous' ? (
                    <p className={classes.hint}>
                        {i18n.t(
                            'Put this step after one that pulls values, such as DHIS2 Instance Pull. Its periods are used, and staging is only used to map the values to the target.'
                        )}
                    </p>
                ) : (
                    <PushPeriodFields
                        name="handlerConfig.period"
                        allowUpdated={source === 'raw'}
                    />
                )}
            </FormSection>

            <FormSection
                title={i18n.t('Import strategy')}
                description={i18n.t(
                    'How the target should treat values that already exist.'
                )}
                tight
            >
                <Controller
                    name="handlerConfig.importStrategy"
                    control={control}
                    render={({ field }) => (
                        <RadioCardGroup<DataValueImportStrategy>
                            name="dhis2-instance-push-import-strategy"
                            value={
                                (field.value as DataValueImportStrategy) ??
                                'CREATE_AND_UPDATE'
                            }
                            onChange={field.onChange}
                            options={IMPORT_STRATEGY_OPTIONS}
                            columns={3}
                        />
                    )}
                />
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
                    description={i18n.t('Lower these if requests time out.')}
                    tight
                >
                    <div className={formSectionGrids.grid2}>
                        {(
                            [
                                [
                                    'orgUnits',
                                    i18n.t('Org units per read from staging'),
                                    1,
                                    500,
                                ],
                                [
                                    'periods',
                                    i18n.t('Periods per analytics read'),
                                    1,
                                    60,
                                ],
                                [
                                    'values',
                                    i18n.t('Values per request to the target'),
                                    PUSH_CHUNK_MIN,
                                    PUSH_CHUNK_MAX,
                                ],
                            ] as const
                        )
                            .filter(([key]) =>
                                key === 'values'
                                    ? true
                                    : key === 'periods'
                                      ? source === 'analytics'
                                      : source !== 'previous'
                            )
                            .map(([key, label, min, max]) => (
                                <Controller
                                    key={key}
                                    name={`handlerConfig.chunk.${key}`}
                                    control={control}
                                    render={({ field, fieldState }) => (
                                        <InputField
                                            label={label}
                                            type="number"
                                            min={String(min)}
                                            max={String(max)}
                                            inputWidth="120px"
                                            value={
                                                Number.isFinite(field.value)
                                                    ? String(field.value)
                                                    : ''
                                            }
                                            onChange={({ value: v }) =>
                                                field.onChange(
                                                    v === ''
                                                        ? undefined
                                                        : Number(v)
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
    source,
}: {
    routeCode: string | undefined
    items: Partial<PushItem>[]
    onSwitchToMappings: () => void
    source: PushSource
}): React.ReactElement {
    const { control, formState } =
        useFormContext<PipelineStepFormWithHandlerValues>()
    const itemsArray = useFieldArray({
        control,
        // Typed loosely: handlerConfig is a record in the step form schema.
        name: 'handlerConfig.items' as never,
    })

    const staging = usePushDataElements(
        null,
        items.flatMap((item) => (item.from ? [item.from] : []))
    )
    // Same-ID candidates too, so a mapped row can offer "Use same ID".
    const target = usePushDataElements(
        routeCode || undefined,
        items.flatMap((item) =>
            [pushItemTarget(item), item.from].filter((id): id is string =>
                Boolean(id)
            )
        )
    )

    const itemsError = (
        formState.errors.handlerConfig as
            | { items?: { message?: string } }
            | undefined
    )?.items?.message

    return (
        <FormSection
            title={i18n.t('Data elements')}
            description={i18n.t(
                'Values of these staging data elements are sent. Each goes into the target data element with the same ID unless you pick another.'
            )}
            tight
        >
            <NoticeBox title={i18n.t('This step lists its own items')}>
                <p>
                    {i18n.t(
                        'Data elements now belong to the connected instance. Map them under Settings › Connected instances › Mappings, then switch this step to pick from them.'
                    )}
                </p>
                <Button small onClick={onSwitchToMappings}>
                    {i18n.t('Use instance mappings')}
                </Button>
            </NoticeBox>
            {target.isError && (
                <NoticeBox warning title={i18n.t('Could not check the target')}>
                    {i18n.t(
                        'Which data elements exist on the target is unknown; the step checks again before sending anything.'
                    )}
                </NoticeBox>
            )}
            {items.length > 0 && (
                <ul className={classes.items}>
                    {itemsArray.fields.map((row, index) => (
                        <PushItemRow
                            key={row.id}
                            index={index}
                            routeCode={routeCode || undefined}
                            staging={staging.data}
                            target={target.data}
                            targetPending={target.isFetching}
                            source={source}
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
                    onClick={() => itemsArray.append({ from: '' } as never)}
                >
                    {i18n.t('Add data element')}
                </Button>
            </div>
        </FormSection>
    )
}
