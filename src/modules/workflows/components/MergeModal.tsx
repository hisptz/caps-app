import { useAlert, useDataEngine } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import {
    Button,
    ButtonStrip,
    IconAdd16,
    InputField,
    Modal,
    ModalActions,
    ModalContent,
    ModalTitle,
    MultiSelectField,
    MultiSelectOption,
    NoticeBox,
    SingleSelectField,
    SingleSelectOption,
    SwitchField,
} from '@dhis2/ui'
import { zodResolver } from '@hookform/resolvers/zod'
import React, { useEffect, useMemo } from 'react'
import {
    Controller,
    FormProvider,
    useFieldArray,
    useForm,
    useWatch,
} from 'react-hook-form'
import classes from './Workflows.module.css'
import { useHandlersQuery } from '@/modules/handlers/hooks/useHandlersQuery'
import { ConnectorConditionRow } from '@/modules/pipeline-connectors/components/ConnectorConditionRow'
import { NO_ESCAPE } from '@/modules/pipeline-connectors/utils/connectorLabels'
import { rowsArePickable } from '@/modules/pipeline-connectors/utils/stepOutputs'
import { useMergeMutations } from '@/modules/workflows/hooks/useWorkflows'
import {
    defaultMergeFormValues,
    mergeFormSchema,
    mergeFormValuesToCreateBody,
    mergeFormValuesToUpdateBody,
    mergeToFormValues,
    type MergeFormValues,
} from '@/modules/workflows/schemas/mergeFormSchema'
import { SegmentedControl } from '@/shared/components/ui/FormPrimitives'
import type {
    PipelineMerge,
    PipelineStep,
    WorkflowDetail,
} from '@/shared/types/caps'

type Props = {
    open: boolean
    workflow: WorkflowDetail
    /** Edit this merge; create a new one when absent */
    merge?: PipelineMerge | null
    /** Preselected pipelines to wait for, e.g. from the diagram */
    initialSourceIds?: string[]
    onClose: () => void
}

const FORM_ID = 'merge-form'

/** Steps of the chosen sources, in order, each labelled with its pipeline. */
function sourceSteps(
    workflow: WorkflowDetail,
    sourceIds: string[]
): { steps: PipelineStep[]; labels: Map<string, string> } {
    const steps: PipelineStep[] = []
    const labels = new Map<string, string>()
    for (const id of sourceIds) {
        const pipeline = workflow.pipelines.find((p) => p.id === id)
        pipeline?.steps.forEach((step, index) => {
            steps.push(step)
            labels.set(
                step.id,
                i18n.t('{{pipeline}} › Step {{number}}: {{name}}', {
                    nsSeparator: '~~',
                    pipeline: pipeline.name,
                    number: index + 1,
                    name: step.name,
                    interpolation: NO_ESCAPE,
                })
            )
        })
    }
    return { steps, labels }
}

export function MergeModal({
    open,
    workflow,
    merge,
    initialSourceIds,
    onClose,
}: Props): React.ReactElement | null {
    const engine = useDataEngine()
    const { data: handlers = [] } = useHandlersQuery(engine)
    const { createMergeMutation, updateMergeMutation } =
        useMergeMutations(engine)
    const { show } = useAlert(
        ({ message }) => message,
        ({ type }) => ({ ...type, duration: 3000 })
    )
    const form = useForm<MergeFormValues>({
        resolver: zodResolver(mergeFormSchema),
        defaultValues: defaultMergeFormValues,
        mode: 'onBlur',
    })
    const conditions = useFieldArray({
        control: form.control,
        name: 'ruleConditions',
    })
    const sourceIds = useWatch({
        control: form.control,
        name: 'sourcePipelineIds',
    })
    const ruleMode = useWatch({ control: form.control, name: 'ruleMode' })
    const { steps, labels } = useMemo(
        () => sourceSteps(workflow, sourceIds ?? []),
        [workflow, sourceIds]
    )
    const isEdit = Boolean(merge)
    const rootError = form.formState.errors.root?.message
    const conditionsError =
        form.formState.errors.ruleConditions?.root?.message ??
        form.formState.errors.ruleConditions?.message

    useEffect(() => {
        if (!open) {
            return
        }
        if (merge) {
            const all = sourceSteps(
                workflow,
                merge.sources.map((s) => s.pipelineId)
            ).steps
            form.reset(
                mergeToFormValues(merge, (rows) =>
                    rowsArePickable(rows, all, handlers)
                )
            )
        } else {
            form.reset({
                ...defaultMergeFormValues,
                sourcePipelineIds: initialSourceIds ?? [],
            })
        }
        form.clearErrors()
        // Not on `handlers`: they load once, and resetting when they arrive would drop edits
    }, [open, merge, workflow, initialSourceIds, form])

    if (!open) {
        return null
    }

    const onError = (err: unknown) =>
        form.setError('root', {
            type: 'server',
            message:
                err instanceof Error
                    ? err.message
                    : i18n.t('Could not save the connector. Try again.'),
        })
    const onSuccess = () => {
        show({
            message: isEdit
                ? i18n.t('Connector updated')
                : i18n.t('Connector created'),
            type: { success: true },
        })
        onClose()
    }

    function onSubmit(values: MergeFormValues) {
        if (merge) {
            updateMergeMutation.mutate(
                { id: merge.id, body: mergeFormValuesToUpdateBody(values) },
                { onSuccess, onError }
            )
        } else {
            createMergeMutation.mutate(
                mergeFormValuesToCreateBody(values, workflow.id),
                { onSuccess, onError }
            )
        }
    }

    const members = workflow.pipelines

    return (
        <Modal large onClose={onClose} position="middle">
            <ModalTitle>
                {isEdit
                    ? i18n.t('Edit connector · waits for all')
                    : i18n.t('New connector · waits for all')}
            </ModalTitle>
            <ModalContent>
                <FormProvider {...form}>
                    <form
                        id={FORM_ID}
                        className={classes.modalBody}
                        onSubmit={form.handleSubmit(onSubmit)}
                    >
                        <p className={classes.help}>
                            {i18n.t(
                                'In each run of this workflow, wait for the chosen pipelines to finish, then start one more.'
                            )}
                        </p>
                        {rootError && (
                            <NoticeBox
                                error
                                title={i18n.t('Could not save the connector')}
                            >
                                {rootError}
                            </NoticeBox>
                        )}
                        <Controller
                            name="name"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <InputField
                                    label={i18n.t('Name')}
                                    required
                                    placeholder={i18n.t(
                                        'e.g. Predict when all data is in'
                                    )}
                                    value={field.value}
                                    onChange={({ value }) =>
                                        field.onChange(value ?? '')
                                    }
                                    onBlur={field.onBlur}
                                    error={Boolean(fieldState.error)}
                                    validationText={fieldState.error?.message}
                                />
                            )}
                        />
                        <Controller
                            name="sourcePipelineIds"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <MultiSelectField
                                    label={i18n.t('Wait for')}
                                    required
                                    selected={field.value}
                                    onChange={({ selected }) =>
                                        field.onChange(selected)
                                    }
                                    error={Boolean(fieldState.error)}
                                    validationText={fieldState.error?.message}
                                >
                                    {members.map((p) => (
                                        <MultiSelectOption
                                            key={p.id}
                                            value={p.id}
                                            label={p.name}
                                        />
                                    ))}
                                </MultiSelectField>
                            )}
                        />
                        <Controller
                            name="targetPipelineId"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <SingleSelectField
                                    label={i18n.t('Then start')}
                                    required
                                    selected={
                                        members.some(
                                            (p) => p.id === field.value
                                        )
                                            ? field.value
                                            : undefined
                                    }
                                    onChange={({ selected }) =>
                                        field.onChange(selected ?? '')
                                    }
                                    error={Boolean(fieldState.error)}
                                    validationText={fieldState.error?.message}
                                >
                                    {members
                                        .filter(
                                            (p) => !sourceIds?.includes(p.id)
                                        )
                                        .map((p) => (
                                            <SingleSelectOption
                                                key={p.id}
                                                value={p.id}
                                                label={p.name}
                                            />
                                        ))}
                                </SingleSelectField>
                            )}
                        />
                        <Controller
                            name="triggerRule"
                            control={form.control}
                            render={({ field }) => (
                                <div>
                                    <p className={classes.help}>
                                        {i18n.t('Continue when')}
                                    </p>
                                    <SegmentedControl
                                        name="merge-trigger-rule"
                                        aria-label={i18n.t('Continue when')}
                                        value={field.value}
                                        onChange={field.onChange}
                                        options={[
                                            {
                                                value: 'ALL_SUCCEEDED',
                                                label: i18n.t('All succeeded'),
                                            },
                                            {
                                                value: 'ALL_DONE',
                                                label: i18n.t(
                                                    'All done, whatever the result'
                                                ),
                                            },
                                        ]}
                                    />
                                </div>
                            )}
                        />
                        <Controller
                            name="timeoutHours"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <InputField
                                    label={i18n.t('Time limit (hours)')}
                                    type="number"
                                    min="1"
                                    value={field.value}
                                    onChange={({ value }) =>
                                        field.onChange(value ?? '')
                                    }
                                    onBlur={field.onBlur}
                                    error={Boolean(fieldState.error)}
                                    validationText={
                                        fieldState.error?.message ??
                                        i18n.t(
                                            'Counted from the first pipeline to finish; after it the merge stops and says which pipeline is missing.'
                                        )
                                    }
                                />
                            )}
                        />

                        <Controller
                            name="ruleMode"
                            control={form.control}
                            render={({ field }) => (
                                <div>
                                    <p className={classes.help}>
                                        {i18n.t('Condition (optional)')}
                                    </p>
                                    <SegmentedControl
                                        name="merge-rule-mode"
                                        aria-label={i18n.t('Condition')}
                                        value={
                                            field.value === 'json'
                                                ? 'json'
                                                : field.value
                                        }
                                        onChange={(next) => {
                                            if (
                                                next === 'conditions' &&
                                                conditions.fields.length === 0
                                            ) {
                                                conditions.append({
                                                    path: '',
                                                    operator: 'gt',
                                                    value: '0',
                                                })
                                            }
                                            field.onChange(next)
                                        }}
                                        options={[
                                            {
                                                value: 'always',
                                                label: i18n.t('Always start'),
                                            },
                                            {
                                                value: 'conditions',
                                                label: i18n.t('Only if…'),
                                            },
                                        ]}
                                    />
                                </div>
                            )}
                        />
                        {ruleMode === 'conditions' && (
                            <>
                                {steps.length === 0 ? (
                                    <p className={classes.help}>
                                        {i18n.t(
                                            'Choose the pipelines to wait for first; their step results can be checked here.'
                                        )}
                                    </p>
                                ) : (
                                    <>
                                        {conditions.fields.map((row, index) => (
                                            <ConnectorConditionRow
                                                key={row.id}
                                                index={index}
                                                steps={steps}
                                                handlers={handlers}
                                                labelStep={(step, i) =>
                                                    labels.get(step.id) ??
                                                    String(i + 1)
                                                }
                                                onRemove={() =>
                                                    conditions.remove(index)
                                                }
                                            />
                                        ))}
                                        <div>
                                            <Button
                                                small
                                                icon={<IconAdd16 />}
                                                onClick={() =>
                                                    conditions.append({
                                                        path: '',
                                                        operator: 'gt',
                                                        value: '0',
                                                    })
                                                }
                                            >
                                                {i18n.t('Add condition')}
                                            </Button>
                                        </div>
                                    </>
                                )}
                                {conditionsError && (
                                    <NoticeBox error>
                                        {conditionsError}
                                    </NoticeBox>
                                )}
                            </>
                        )}
                        {ruleMode === 'json' && (
                            <NoticeBox
                                warning
                                title={i18n.t(
                                    'This rule was written outside the app'
                                )}
                            >
                                {i18n.t(
                                    'It is kept as it is when you save. Choosing Always start or Only if… replaces it.'
                                )}
                            </NoticeBox>
                        )}

                        <Controller
                            name="isActive"
                            control={form.control}
                            render={({ field }) => (
                                <SwitchField
                                    checked={field.value}
                                    onChange={({ checked }) =>
                                        field.onChange(checked)
                                    }
                                    label={
                                        field.value
                                            ? i18n.t('Active')
                                            : i18n.t(
                                                  'Off (never starts anything)'
                                              )
                                    }
                                />
                            )}
                        />
                    </form>
                </FormProvider>
            </ModalContent>
            <ModalActions>
                <ButtonStrip end>
                    <Button type="button" onClick={onClose}>
                        {i18n.t('Cancel')}
                    </Button>
                    <Button
                        primary
                        type="submit"
                        form={FORM_ID}
                        loading={
                            createMergeMutation.isPending ||
                            updateMergeMutation.isPending
                        }
                    >
                        {isEdit ? i18n.t('Save') : i18n.t('Create connector')}
                    </Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    )
}
