import { useDataEngine } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import {
    Button,
    ButtonStrip,
    CircularLoader,
    IconAdd16,
    IconDelete16,
    InputField,
    Modal,
    ModalActions,
    ModalContent,
    ModalTitle,
    NoticeBox,
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
import {
    useOcsPipelineMutations,
    useOcsPipelineOptionsQuery,
} from '../hooks/useOcsPipelines'
import {
    argumentProblems,
    emptyOcsPipelineForm,
    fromOcsPipeline,
    ocsPipelineFormSchema,
    type OcsPipelineFormValues,
    toOcsPipelineBody,
} from '../schemas/ocsPipelineFormSchema'
import { ocsErrorMessages } from '../utils/ocsErrors'
import classes from './OcsPipeline.module.css'
import { OcsWorkflowArgumentField } from './OcsWorkflowArgumentField'
import type { OcsPipeline } from '@/capsApi/types'
import { DataElementSelector } from '@/shared/components/HandlerConfigForms/DataElementSelector'
import {
    FormSection,
    SingleSelectControl,
} from '@/shared/components/ui/FormPrimitives'

const FORM_ID = 'ocs-pipeline-form'

type Props = {
    open: boolean
    /** The pipeline to edit; a new one is created without it. */
    pipeline?: OcsPipeline | null
    onClose: () => void
    onSaved: (pipeline: OcsPipeline) => void
}

/**
 * Creates or edits an Open Climate Service pipeline: the workflow with its inputs, and the
 * DHIS2 data elements its result series go to. OCS validates it on save and keeps it; the
 * `ocs-pipeline-run` step decides when it runs, so it is saved with policy `manual`.
 */
export function OcsPipelineModal({
    open,
    pipeline,
    onClose,
    onSaved,
}: Props): React.ReactElement | null {
    const engine = useDataEngine()
    const editing = Boolean(pipeline)
    const optionsQuery = useOcsPipelineOptionsQuery(engine, open)
    const { createMutation, updateMutation } = useOcsPipelineMutations(engine)
    const form = useForm<OcsPipelineFormValues>({
        resolver: zodResolver(ocsPipelineFormSchema),
        defaultValues: emptyOcsPipelineForm,
        mode: 'onBlur',
    })
    const series = useFieldArray({ control: form.control, name: 'series' })
    const workflowId = useWatch({ control: form.control, name: 'workflowId' })
    const rootError = form.formState.errors.root?.message

    useEffect(() => {
        if (open) {
            form.reset(
                pipeline ? fromOcsPipeline(pipeline) : emptyOcsPipelineForm
            )
            form.clearErrors()
        }
    }, [open, pipeline, form])

    const options = optionsQuery.data
    const workflow = useMemo(
        () => options?.workflows.find((item) => item.id === workflowId),
        [options, workflowId]
    )
    const workflowOptions = useMemo(() => {
        const items = (options?.workflows ?? []).map((item) => ({
            value: item.id,
            label:
                item.summary === item.id
                    ? item.id
                    : `${item.summary} (${item.id})`,
        }))
        // A pipeline's workflow may no longer be pipeline-ready; keep it choosable to show it.
        if (workflowId && !items.some((item) => item.value === workflowId)) {
            items.push({ value: workflowId, label: workflowId })
        }
        return items
    }, [options, workflowId])
    const connectionOptions = useMemo(
        () =>
            (options?.connections ?? []).map((value) => ({
                value,
                label: value,
            })),
        [options]
    )

    const saving = createMutation.isPending || updateMutation.isPending

    function onSubmit(values: OcsPipelineFormValues): void {
        const parameters = workflow?.parameters ?? []
        const problems = argumentProblems(parameters, values.arguments)
        if (Object.keys(problems).length > 0) {
            for (const [name, message] of Object.entries(problems)) {
                form.setError(`arguments.${name}`, { type: 'manual', message })
            }
            return
        }
        const body = toOcsPipelineBody(values, parameters)
        const handlers = {
            onSuccess: (saved: OcsPipeline) => {
                onSaved(saved)
                onClose()
            },
            onError: (error: unknown) => {
                form.setError('root', {
                    type: 'server',
                    message: ocsErrorMessages(error).join('\n'),
                })
            },
        }
        if (pipeline) {
            const change = {
                name: body.name,
                workflow: body.workflow,
                destination: body.destination,
            }
            updateMutation.mutate(
                {
                    id: pipeline.spec.id,
                    body: {
                        ...change,
                        revision: pipeline.revision,
                        delivery: { mode: pipeline.spec.delivery.mode },
                    },
                },
                handlers
            )
        } else {
            createMutation.mutate(
                { ...body, delivery: { mode: 'dry_run' } },
                handlers
            )
        }
    }

    if (!open) {
        return null
    }

    return (
        <Modal large onClose={onClose} position="middle">
            <ModalTitle>
                {editing
                    ? i18n.t('Edit OCS pipeline')
                    : i18n.t('New OCS pipeline')}
            </ModalTitle>
            <ModalContent>
                <p className={classes.subtitle}>
                    {i18n.t(
                        'Open Climate Service runs the workflow and delivers its results to the DHIS2 data elements you map here. CAPS starts each run.'
                    )}
                </p>
                {optionsQuery.isLoading ? (
                    <div className={classes.loading}>
                        <CircularLoader small />
                    </div>
                ) : optionsQuery.error ? (
                    <NoticeBox
                        error
                        title={i18n.t('Could not reach Open Climate Service')}
                    >
                        {ocsErrorMessages(optionsQuery.error).join(' ')}
                    </NoticeBox>
                ) : (
                    <FormProvider {...form}>
                        <form
                            id={FORM_ID}
                            className={classes.body}
                            // The step form around this modal must not submit with it.
                            onSubmit={(event) => {
                                event.stopPropagation()
                                void form.handleSubmit(onSubmit)(event)
                            }}
                        >
                            {rootError && (
                                <NoticeBox
                                    error
                                    title={i18n.t(
                                        'Open Climate Service did not save it'
                                    )}
                                >
                                    <ul className={classes.problems}>
                                        {rootError.split('\n').map((line) => (
                                            <li key={line}>{line}</li>
                                        ))}
                                    </ul>
                                </NoticeBox>
                            )}
                            <FormSection title={i18n.t('Pipeline')} tight>
                                <div className={classes.grid2}>
                                    <Controller
                                        name="id"
                                        control={form.control}
                                        render={({ field, fieldState }) => (
                                            <InputField
                                                label={i18n.t('Id')}
                                                required
                                                disabled={editing}
                                                helpText={
                                                    editing
                                                        ? i18n.t(
                                                              'The id cannot change.'
                                                          )
                                                        : i18n.t(
                                                              'Also the id of the export OCS saves the results through, e.g. chirps-precip-district.'
                                                          )
                                                }
                                                name={field.name}
                                                value={field.value ?? ''}
                                                onChange={({ value }) =>
                                                    field.onChange(value)
                                                }
                                                onBlur={field.onBlur}
                                                error={Boolean(
                                                    fieldState.error
                                                )}
                                                validationText={
                                                    fieldState.error?.message
                                                }
                                            />
                                        )}
                                    />
                                    <Controller
                                        name="name"
                                        control={form.control}
                                        render={({ field }) => (
                                            <InputField
                                                label={i18n.t('Name')}
                                                name={field.name}
                                                value={field.value ?? ''}
                                                onChange={({ value }) =>
                                                    field.onChange(value)
                                                }
                                                onBlur={field.onBlur}
                                            />
                                        )}
                                    />
                                </div>
                            </FormSection>

                            <FormSection title={i18n.t('Workflow')} tight>
                                <Controller
                                    name="workflowId"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <div>
                                            <SingleSelectControl
                                                name={field.name}
                                                value={field.value}
                                                options={workflowOptions}
                                                placeholder={i18n.t(
                                                    'Choose a workflow'
                                                )}
                                                error={Boolean(
                                                    fieldState.error
                                                )}
                                                filterable={
                                                    workflowOptions.length > 8
                                                }
                                                onChange={(value) => {
                                                    field.onChange(value)
                                                    form.setValue(
                                                        'arguments',
                                                        {}
                                                    )
                                                }}
                                            />
                                            {fieldState.error?.message ? (
                                                <p className={classes.error}>
                                                    {fieldState.error.message}
                                                </p>
                                            ) : null}
                                        </div>
                                    )}
                                />
                                {workflow?.description ? (
                                    <p className={classes.help}>
                                        {workflow.description}
                                    </p>
                                ) : null}
                                {workflow && options ? (
                                    <div className={classes.grid2}>
                                        {workflow.parameters.map(
                                            (parameter) => (
                                                <OcsWorkflowArgumentField
                                                    key={`${workflow.id}-${parameter.name}`}
                                                    parameter={parameter}
                                                    options={options}
                                                />
                                            )
                                        )}
                                    </div>
                                ) : null}
                                {workflow &&
                                workflow.intervalParameters.length > 0 ? (
                                    <p className={classes.help}>
                                        {i18n.t(
                                            'Each run fills {{parameter}} with the period of the step that runs it.',
                                            {
                                                parameter:
                                                    workflow.intervalParameters.join(
                                                        ', '
                                                    ),
                                            }
                                        )}
                                    </p>
                                ) : null}
                            </FormSection>

                            <FormSection
                                title={i18n.t('Deliver to DHIS2')}
                                tight
                            >
                                <div className={classes.grid2}>
                                    <Controller
                                        name="connection"
                                        control={form.control}
                                        render={({ field, fieldState }) =>
                                            connectionOptions.length > 0 ? (
                                                <div>
                                                    <label
                                                        className={
                                                            classes.label
                                                        }
                                                    >
                                                        {i18n.t(
                                                            'DHIS2 connection'
                                                        )}{' '}
                                                        *
                                                    </label>
                                                    <SingleSelectControl
                                                        name={field.name}
                                                        value={field.value}
                                                        options={
                                                            connectionOptions
                                                        }
                                                        placeholder={i18n.t(
                                                            'Choose a connection'
                                                        )}
                                                        error={Boolean(
                                                            fieldState.error
                                                        )}
                                                        onChange={
                                                            field.onChange
                                                        }
                                                    />
                                                    <p className={classes.help}>
                                                        {fieldState.error
                                                            ?.message ??
                                                            i18n.t(
                                                                'A named DHIS2 connection in the OCS instance config.'
                                                            )}
                                                    </p>
                                                </div>
                                            ) : (
                                                <InputField
                                                    label={i18n.t(
                                                        'DHIS2 connection'
                                                    )}
                                                    required
                                                    helpText={i18n.t(
                                                        'The name of a DHIS2 connection in the OCS instance config (dhis2_connections). Set OCS_DHIS2_CONNECTIONS on the CAPS engine to choose from a list.'
                                                    )}
                                                    name={field.name}
                                                    value={field.value ?? ''}
                                                    onChange={({ value }) =>
                                                        field.onChange(value)
                                                    }
                                                    onBlur={field.onBlur}
                                                    error={Boolean(
                                                        fieldState.error
                                                    )}
                                                    validationText={
                                                        fieldState.error
                                                            ?.message
                                                    }
                                                />
                                            )
                                        }
                                    />
                                    <Controller
                                        name="dataSet"
                                        control={form.control}
                                        render={({ field, fieldState }) => (
                                            <InputField
                                                label={i18n.t(
                                                    'Data set (optional)'
                                                )}
                                                helpText={i18n.t(
                                                    'UID of a data set to check period type and org unit assignment against.'
                                                )}
                                                name={field.name}
                                                value={field.value ?? ''}
                                                onChange={({ value }) =>
                                                    field.onChange(value)
                                                }
                                                onBlur={field.onBlur}
                                                error={Boolean(
                                                    fieldState.error
                                                )}
                                                validationText={
                                                    fieldState.error?.message
                                                }
                                            />
                                        )}
                                    />
                                </div>
                                <p className={classes.help}>
                                    {i18n.t(
                                        'Map each result series of the workflow, in order, to a data element. The pickers search this DHIS2, so the connection should point at it.'
                                    )}
                                </p>
                                {series.fields.map((row, index) => (
                                    <div
                                        key={row.id}
                                        className={classes.seriesRow}
                                    >
                                        <span className={classes.seriesIndex}>
                                            {index + 1}
                                        </span>
                                        <div className={classes.seriesElement}>
                                            <DataElementSelector
                                                name={`series.${index}.dataElement`}
                                                label={i18n.t('Data element')}
                                                dense
                                            />
                                        </div>
                                        <Controller
                                            name={`series.${index}.categoryOptionCombo`}
                                            control={form.control}
                                            render={({ field, fieldState }) => (
                                                <InputField
                                                    dense
                                                    label={i18n.t(
                                                        'Category option combo (optional)'
                                                    )}
                                                    name={field.name}
                                                    value={field.value ?? ''}
                                                    onChange={({ value }) =>
                                                        field.onChange(value)
                                                    }
                                                    onBlur={field.onBlur}
                                                    error={Boolean(
                                                        fieldState.error
                                                    )}
                                                    validationText={
                                                        fieldState.error
                                                            ?.message
                                                    }
                                                />
                                            )}
                                        />
                                        <Button
                                            small
                                            secondary
                                            icon={<IconDelete16 />}
                                            disabled={
                                                series.fields.length === 1
                                            }
                                            onClick={() => series.remove(index)}
                                            title={i18n.t('Remove series')}
                                        />
                                    </div>
                                ))}
                                {form.formState.errors.series?.root?.message ||
                                form.formState.errors.series?.message ? (
                                    <p className={classes.error}>
                                        {form.formState.errors.series?.root
                                            ?.message ??
                                            form.formState.errors.series
                                                ?.message}
                                    </p>
                                ) : null}
                                <div>
                                    <Button
                                        small
                                        icon={<IconAdd16 />}
                                        onClick={() =>
                                            series.append({
                                                dataElement: '',
                                                categoryOptionCombo: '',
                                            })
                                        }
                                    >
                                        {i18n.t('Add series')}
                                    </Button>
                                </div>
                            </FormSection>
                        </form>
                    </FormProvider>
                )}
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
                        loading={saving}
                        disabled={saving || !options}
                    >
                        {editing ? i18n.t('Save') : i18n.t('Create in OCS')}
                    </Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    )
}
