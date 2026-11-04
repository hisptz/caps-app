import { useDataEngine } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import {
    Button,
    ButtonStrip,
    CircularLoader,
    IconAdd16,
    IconChevronDown16,
    IconChevronUp16,
    Modal,
    ModalActions,
    ModalContent,
    ModalTitle,
    NoticeBox,
    Tag,
} from '@dhis2/ui'
import { zodResolver } from '@hookform/resolvers/zod'
import React, { useEffect, useRef, useState } from 'react'
import {
    Controller,
    FormProvider,
    useFieldArray,
    useForm,
    useWatch,
} from 'react-hook-form'
import classes from './ConnectedInstances.module.css'
import { CapsApiError } from '@/capsApi/client'
import {
    useAllMappingsQuery,
    useInstanceQuery,
    useSaveInstance,
} from '@/modules/connected-instances/hooks/useInstanceMappings'
import {
    formValuesToPutBody,
    instanceToFormValues,
    mappingsFormSchema,
    type MappingsFormValues,
    parseSaveInstanceConflict,
    rowsTakenByOtherInstances,
} from '@/modules/connected-instances/schemas/mappingsForm'
import type { SourceRoute } from '@/modules/connected-instances/schemas/routeForm'
import { CREATE_MISSING_DATA_ELEMENTS } from '@/modules/dhis2-instance-pull/constants'
import {
    CreateMissingDataElementsError,
    type InstancePullDrafts,
    useCreateMissingDataElements,
    useVerifyPullTargets,
} from '@/modules/dhis2-instance-pull/hooks/useCreateMissingDataElements'
import {
    useSourceDataElementCombos,
    useSourceDataItemsById,
    useStagingDataElements,
} from '@/modules/dhis2-instance-pull/hooks/usePullItemQueries'
import {
    type OrgUnitMatch,
    type PullItem,
    pullItemTarget,
} from '@/modules/dhis2-instance-pull/schemas/config'
import {
    PushTargetsError,
    usePushDataElements,
    useVerifyPushTargets,
} from '@/modules/dhis2-instance-push/hooks/usePushItemQueries'
import {
    type PushItem,
    pushItemTarget,
} from '@/modules/dhis2-instance-push/schemas/config'
import { ConfigLabeledControl } from '@/shared/components/HandlerConfigForms/ConfigLabeledControl'
import pullClasses from '@/shared/components/HandlerConfigForms/Dhis2InstancePullConfig/Dhis2InstancePullConfig.module.css'
import { SourceItemRow } from '@/shared/components/HandlerConfigForms/Dhis2InstancePullConfig/SourceItemRow'
import { PushItemRow } from '@/shared/components/HandlerConfigForms/Dhis2InstancePushConfig/PushItemRow'
import { SegmentedControl } from '@/shared/components/ui/FormPrimitives'

const FORM_ID = 'instance-mappings-form'
const EMPTY_PULL: PullItem[] = []
const EMPTY_PUSH: Partial<PushItem>[] = []

/** A direction's mappings: collapsed while empty, opened by adding one. */
function MappingSection({
    title,
    description,
    count,
    addLabel,
    onAdd,
    children,
}: {
    title: string
    description: string
    count: number
    addLabel: string
    onAdd: () => void
    children: React.ReactNode
}): React.ReactElement {
    // Follows whether there are rows until toggled: rows load after the first render.
    const [toggled, setToggled] = useState<boolean | null>(null)
    const open = toggled ?? count > 0
    const setOpen = (next: boolean) => setToggled(next)
    return (
        <section className={classes.mappingSection}>
            <header className={classes.mappingSectionHeader}>
                <button
                    type="button"
                    className={classes.mappingSectionToggle}
                    aria-expanded={open}
                    onClick={() => setOpen(!open)}
                >
                    {open ? <IconChevronUp16 /> : <IconChevronDown16 />}
                    <span className={classes.mappingSectionTitle}>{title}</span>
                    <Tag neutral>{String(count)}</Tag>
                </button>
                <Button
                    small
                    secondary
                    icon={<IconAdd16 />}
                    onClick={() => {
                        onAdd()
                        setOpen(true)
                    }}
                >
                    {addLabel}
                </Button>
            </header>
            {open && (
                <div className={classes.mappingSectionBody}>
                    <p className={classes.empty}>{description}</p>
                    {count > 0 && (
                        <ul className={pullClasses.items}>{children}</ul>
                    )}
                </div>
            )}
        </section>
    )
}

export function InstanceMappingsModal({
    route,
    onClose,
    onSaved,
}: {
    route: SourceRoute
    onClose: () => void
    onSaved: () => void
}): React.ReactElement {
    const engine = useDataEngine()
    const routeCode = route.code
    const instanceQuery = useInstanceQuery(engine, routeCode)
    const allMappingsQuery = useAllMappingsQuery(engine)
    const saveMutation = useSaveInstance(engine, routeCode)
    const createMissingDataElements = useCreateMissingDataElements()
    const verifyPullTargets = useVerifyPullTargets()
    const verifyPushTargets = useVerifyPushTargets()

    const form = useForm<MappingsFormValues>({
        resolver: zodResolver(mappingsFormSchema),
        defaultValues: instanceToFormValues(undefined),
    })
    const { control, formState } = form
    const pullArray = useFieldArray({ control, name: 'pull' })
    const pushArray = useFieldArray({ control, name: 'push' })

    const instance = instanceQuery.data
    // Loaded once per opening, so refetches (e.g. on window focus) don't wipe edits.
    const loaded = useRef(false)
    useEffect(() => {
        if (instance && !loaded.current) {
            form.reset(instanceToFormValues(instance))
            form.clearErrors()
            loaded.current = true
        }
    }, [form, instance])

    const orgUnitMatch = useWatch({ control, name: 'orgUnitMatch' })
    const pull =
        (useWatch({ control, name: 'pull' }) as PullItem[] | undefined) ??
        EMPTY_PULL
    const push =
        (useWatch({ control, name: 'push' }) as
            | Partial<PushItem>[]
            | undefined) ?? EMPTY_PUSH

    // Pull rows: names and categories on both sides.
    const sourceItems = useSourceDataItemsById(routeCode, pull)
    const pullStagingIds = pull.flatMap((item) => {
        const target = pullItemTarget(item)
        return target ? [target] : []
    })
    const staging = useStagingDataElements(pullStagingIds)
    const stagingNames =
        pullStagingIds.length === 0
            ? new Map<string, string>()
            : staging.data &&
              new Map([...staging.data].map(([id, de]) => [id, de.name]))
    const sourceCombos = useSourceDataElementCombos(
        routeCode,
        pull.flatMap((item) =>
            item.fromType === 'DATA_ELEMENT' && item.from ? [item.from] : []
        )
    )

    // Push rows: what the push step's own rows look up.
    const pushStaging = usePushDataElements(
        null,
        push.flatMap((item) => (item.from ? [item.from] : []))
    )
    const pushTarget = usePushDataElements(
        routeCode,
        push.flatMap((item) =>
            [pushItemTarget(item), item.from].filter((id): id is string =>
                Boolean(id)
            )
        )
    )

    const mappedSteps = (instance?.steps ?? []).filter(
        (step) => step.mapped !== null
    )
    const stagingName = (id: string) =>
        staging.data?.get(id)?.name ?? pushStaging.data?.get(id)?.name ?? id
    const takenMessage = (list: string) =>
        i18n.t(
            'Only one instance can pull into a staging data element. Already pulled into from another instance: {{list}}',
            { list, nsSeparator: '~~' }
        )

    async function submit(values: MappingsFormValues) {
        const taken = rowsTakenByOtherInstances(
            routeCode,
            values.pull,
            allMappingsQuery.data ?? []
        )
        if (taken.length > 0) {
            form.setError('root', {
                message: takenMessage(
                    taken
                        .map(
                            ({ index, routeCode: other }) =>
                                `${stagingName(pullItemTarget(values.pull[index]) ?? '')} (${other})`
                        )
                        .join(', ')
                ),
            })
            return
        }

        // The same checks the steps run, so a broken mapping is caught here, not mid-run.
        let checkedPull = values.pull
        try {
            if (values.pull.length > 0) {
                const config = { routeCode, items: values.pull }
                if (CREATE_MISSING_DATA_ELEMENTS) {
                    checkedPull = (
                        await createMissingDataElements(
                            config,
                            (values.drafts ?? {}) as InstancePullDrafts
                        )
                    ).config.items
                } else {
                    await verifyPullTargets(config)
                }
            }
            if (values.push.length > 0) {
                await verifyPushTargets(routeCode, values.push)
            }
        } catch (err) {
            form.setError('root', {
                message:
                    err instanceof CreateMissingDataElementsError ||
                    err instanceof PushTargetsError
                        ? err.message
                        : i18n.t(
                              'Could not check the data elements: {{message}}',
                              {
                                  message:
                                      err instanceof Error
                                          ? err.message
                                          : String(err),
                                  nsSeparator: '~~',
                              }
                          ),
            })
            return
        }

        try {
            await saveMutation.mutateAsync(
                formValuesToPutBody({ ...values, pull: checkedPull })
            )
            onSaved()
            onClose()
        } catch (err) {
            const conflict =
                err instanceof CapsApiError
                    ? parseSaveInstanceConflict(err.body)
                    : null
            form.setError('root', {
                message:
                    conflict?.kind === 'taken'
                        ? takenMessage(
                              conflict.taken
                                  .map(
                                      (t) =>
                                          `${stagingName(t.stagingDataElement)} (${t.routeCode})`
                                  )
                                  .join(', ')
                          )
                        : conflict?.kind === 'in-use'
                          ? i18n.t(
                                'Some mappings that steps use were removed or moved to the other direction. Take them out of these steps first: {{list}}',
                                {
                                    list: conflict.steps
                                        .map(
                                            (s) =>
                                                `${s.pipelineName} › ${s.stepName} (${s.missing.map(stagingName).join(', ')})`
                                        )
                                        .join('; '),
                                    nsSeparator: '~~',
                                }
                            )
                          : err instanceof Error
                            ? err.message
                            : i18n.t('Could not save the mappings.'),
            })
        }
    }

    const saving = formState.isSubmitting || saveMutation.isPending

    return (
        <Modal large onClose={onClose} position="middle">
            <ModalTitle>
                {i18n.t('Mappings · {{name}}', { name: route.name })}
            </ModalTitle>
            <ModalContent>
                {instanceQuery.isLoading && <CircularLoader small />}
                {instanceQuery.isError && (
                    <NoticeBox error title={i18n.t('Could not load mappings')}>
                        {instanceQuery.error instanceof Error
                            ? instanceQuery.error.message
                            : i18n.t('The CAPS service could not be reached.')}
                    </NoticeBox>
                )}
                {instance && (
                    <FormProvider {...form}>
                        <form
                            id={FORM_ID}
                            onSubmit={form.handleSubmit(submit)}
                            className={classes.mappingsForm}
                        >
                            <Controller
                                name="orgUnitMatch"
                                control={control}
                                render={({ field }) => (
                                    <ConfigLabeledControl
                                        label={i18n.t('Match org units by')}
                                        helpText={
                                            orgUnitMatch === 'code'
                                                ? i18n.t(
                                                      'For every pull and push with this instance. Org units without a code are skipped.'
                                                  )
                                                : i18n.t(
                                                      'For every pull and push with this instance. Use code when it and staging have different IDs for the same places.'
                                                  )
                                        }
                                    >
                                        <SegmentedControl<OrgUnitMatch>
                                            name="instance-org-unit-match"
                                            value={field.value}
                                            options={[
                                                {
                                                    value: 'id',
                                                    label: i18n.t('ID'),
                                                },
                                                {
                                                    value: 'code',
                                                    label: i18n.t('Code'),
                                                },
                                            ]}
                                            onChange={field.onChange}
                                            aria-label={i18n.t(
                                                'Match org units by'
                                            )}
                                        />
                                    </ConfigLabeledControl>
                                )}
                            />

                            <MappingSection
                                title={i18n.t('Pull from this instance')}
                                description={i18n.t(
                                    'Values come from this instance into staging. Only one instance can pull into a staging data element.'
                                )}
                                count={pullArray.fields.length}
                                addLabel={i18n.t('Add pull')}
                                onAdd={() =>
                                    pullArray.append({
                                        from: '',
                                        fromType: 'DATA_ELEMENT',
                                    })
                                }
                            >
                                {pullArray.fields.map((row, index) => (
                                    <SourceItemRow
                                        key={row.id}
                                        index={index}
                                        name={`pull.${index}`}
                                        draftsName="drafts"
                                        targetLabel={i18n.t(
                                            'Staging data element'
                                        )}
                                        routeCode={routeCode}
                                        selected={
                                            pull[index]?.from
                                                ? sourceItems.data?.get(
                                                      pull[index].from
                                                  )
                                                : undefined
                                        }
                                        staging={stagingNames}
                                        stagingPending={
                                            staging.isFetching &&
                                            (staging.isPreviousData ||
                                                !staging.data)
                                        }
                                        sourcePending={
                                            sourceItems.isFetching ||
                                            sourceCombos.isFetching
                                        }
                                        stagingCombo={
                                            pull[index]
                                                ? staging.data?.get(
                                                      pullItemTarget(
                                                          pull[index]
                                                      ) ?? ''
                                                  )?.combo
                                                : undefined
                                        }
                                        sourceCombo={
                                            pull[index]?.from
                                                ? sourceCombos.data?.get(
                                                      pull[index].from
                                                  )?.combo
                                                : undefined
                                        }
                                        onRemove={() => pullArray.remove(index)}
                                    />
                                ))}
                            </MappingSection>

                            <MappingSection
                                title={i18n.t('Push to this instance')}
                                description={i18n.t(
                                    'Values go from staging into data elements on this instance. Several instances can receive the same staging data element.'
                                )}
                                count={pushArray.fields.length}
                                addLabel={i18n.t('Add push')}
                                onAdd={() => pushArray.append({ from: '' })}
                            >
                                {pushArray.fields.map((row, index) => (
                                    <PushItemRow
                                        key={row.id}
                                        index={index}
                                        name={`push.${index}`}
                                        routeCode={routeCode}
                                        staging={pushStaging.data}
                                        target={pushTarget.data}
                                        targetPending={pushTarget.isFetching}
                                        source="raw"
                                        onRemove={() => pushArray.remove(index)}
                                    />
                                ))}
                            </MappingSection>

                            {mappedSteps.length > 0 && (
                                <p className={classes.itemMeta}>
                                    {i18n.t('Used by: {{steps}}', {
                                        steps: mappedSteps
                                            .map(
                                                (s) =>
                                                    `${s.pipelineName} › ${s.stepName}`
                                            )
                                            .join(', '),
                                        nsSeparator: '~~',
                                    })}
                                </p>
                            )}

                            {formState.errors.root?.message && (
                                <NoticeBox
                                    error
                                    title={i18n.t('Could not save')}
                                >
                                    {formState.errors.root.message}
                                </NoticeBox>
                            )}
                        </form>
                    </FormProvider>
                )}
            </ModalContent>
            <ModalActions>
                <ButtonStrip end>
                    <Button onClick={onClose} disabled={saving}>
                        {i18n.t('Cancel')}
                    </Button>
                    <Button
                        primary
                        type="submit"
                        form={FORM_ID}
                        loading={saving}
                        disabled={!instance}
                    >
                        {i18n.t('Save mappings')}
                    </Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    )
}
