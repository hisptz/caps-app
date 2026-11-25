import { useDataEngine } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import {
    Button,
    ButtonStrip,
    CircularLoader,
    Field,
    InputField,
    Modal,
    ModalActions,
    ModalContent,
    ModalTitle,
    NoticeBox,
} from '@dhis2/ui'
import { zodResolver } from '@hookform/resolvers/zod'
import React, { useEffect, useMemo } from 'react'
import { Controller, FormProvider, useForm, useWatch } from 'react-hook-form'
import {
    useGeoservicePipelineMutations,
    useGeoservicePipelineOptionsQuery,
} from '../hooks/useGeoservicePipelines'
import {
    argumentProblems,
    emptyGeoservicePipelineForm,
    fromGeoservicePipeline,
    geoservicePipelineFormSchema,
    type GeoservicePipelineFormValues,
    toGeoservicePipelineBody,
} from '../schemas/geoservicePipelineFormSchema'
import { geoserviceErrorMessages } from '../utils/geoserviceErrors'
import { CategoryOptionComboSelector } from './CategoryOptionComboSelector'
import { DataSetSelector } from './DataSetSelector'
import classes from './GeoservicePipeline.module.css'
import { GeoserviceWorkflowArgumentField } from './GeoserviceWorkflowArgumentField'
import type { GeoservicePipeline } from '@/capsApi/types'
import { DataElementSelector } from '@/shared/components/HandlerConfigForms/DataElementSelector'
import {
    FormSection,
    SingleSelectControl,
} from '@/shared/components/ui/FormPrimitives'

const FORM_ID = 'geoservice-pipeline-form'

type Props = {
    open: boolean
    /** The pipeline to edit; a new one is created without it. */
    pipeline?: GeoservicePipeline | null
    onClose: () => void
    onSaved: (pipeline: GeoservicePipeline) => void
}

/**
 * Creates or edits an Open Geo Service pipeline: the workflow with its inputs, and the
 * DHIS2 data element its result goes to. geoservice validates it on save and keeps it; the
 * `ocs-pipeline-run` step decides when it runs, so it is saved with policy `manual`.
 */
export function GeoservicePipelineModal({
    open,
    pipeline,
    onClose,
    onSaved,
}: Props): React.ReactElement | null {
    const engine = useDataEngine()
    const editing = Boolean(pipeline)
    const optionsQuery = useGeoservicePipelineOptionsQuery(engine, open)
    const { createMutation, updateMutation } =
        useGeoservicePipelineMutations(engine)
    const form = useForm<GeoservicePipelineFormValues>({
        resolver: zodResolver(geoservicePipelineFormSchema),
        defaultValues: emptyGeoservicePipelineForm,
        mode: 'onBlur',
    })
    const workflowId = useWatch({ control: form.control, name: 'workflowId' })
    const dataSetId = useWatch({ control: form.control, name: 'dataSet' })
    const rootError = form.formState.errors.root?.message

    useEffect(() => {
        if (open) {
            form.reset(
                pipeline
                    ? fromGeoservicePipeline(pipeline)
                    : emptyGeoservicePipelineForm
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
            label: item.summary,
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

    function onSubmit(values: GeoservicePipelineFormValues): void {
        const parameters = workflow?.parameters ?? []
        const problems = argumentProblems(parameters, values.arguments)
        if (Object.keys(problems).length > 0) {
            for (const [name, message] of Object.entries(problems)) {
                form.setError(`arguments.${name}`, { type: 'manual', message })
            }
            return
        }
        const body = toGeoservicePipelineBody(values, parameters)
        const handlers = {
            onSuccess: (saved: GeoservicePipeline) => {
                onSaved(saved)
                onClose()
            },
            onError: (error: unknown) => {
                form.setError('root', {
                    type: 'server',
                    message: geoserviceErrorMessages(error).join('\n'),
                })
            },
        }
        if (pipeline) {
            updateMutation.mutate(
                {
                    id: pipeline.spec.id,
                    body: {
                        name: body.name,
                        workflow: body.workflow,
                        destination: body.destination,
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

    let content: React.ReactNode
    if (optionsQuery.isLoading) {
        content = (
            <div className={classes.loading}>
                <CircularLoader small />
            </div>
        )
    } else if (optionsQuery.error || !options) {
        content = (
            <NoticeBox error title={i18n.t('Could not reach geoservice')}>
                {geoserviceErrorMessages(optionsQuery.error).join(' ')}
            </NoticeBox>
        )
    } else {
        content = (
            <FormProvider {...form}>
                <form
                    id={FORM_ID}
                    className={classes.form}
                    // The step form around this modal must not submit with it.
                    onSubmit={(event) => {
                        event.stopPropagation()
                        void form.handleSubmit(onSubmit)(event)
                    }}
                >
                    {rootError ? (
                        <div style={{ marginBottom: 16 }}>
                            <NoticeBox
                                error
                                title={i18n.t('Geoservice did not save it')}
                            >
                                <ul className={classes.problems}>
                                    {rootError.split('\n').map((line) => (
                                        <li key={line}>{line}</li>
                                    ))}
                                </ul>
                            </NoticeBox>
                        </div>
                    ) : null}

                    <FormSection title={i18n.t('Pipeline')}>
                        <div className={classes.grid2}>
                            <Controller
                                name="id"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <InputField
                                        label={i18n.t('Id')}
                                        required
                                        disabled={editing}
                                        placeholder="chirps-precip-district"
                                        name={field.name}
                                        value={field.value ?? ''}
                                        onChange={({ value }) =>
                                            field.onChange(value)
                                        }
                                        onBlur={field.onBlur}
                                        error={Boolean(fieldState.error)}
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

                    <FormSection title={i18n.t('Workflow')}>
                        <Controller
                            name="workflowId"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field
                                    label={i18n.t('Workflow')}
                                    required
                                    error={Boolean(fieldState.error)}
                                    validationText={fieldState.error?.message}
                                >
                                    <SingleSelectControl
                                        name={field.name}
                                        value={field.value}
                                        options={workflowOptions}
                                        placeholder={i18n.t(
                                            'Choose a workflow'
                                        )}
                                        error={Boolean(fieldState.error)}
                                        filterable={workflowOptions.length > 8}
                                        onChange={(value) => {
                                            field.onChange(value)
                                            form.setValue('arguments', {})
                                        }}
                                    />
                                </Field>
                            )}
                        />
                        {workflow && workflow.parameters.length > 0 ? (
                            <div className={classes.grid2}>
                                {workflow.parameters.map((parameter) => (
                                    <GeoserviceWorkflowArgumentField
                                        key={`${workflow.id}-${parameter.name}`}
                                        parameter={parameter}
                                        options={options}
                                    />
                                ))}
                            </div>
                        ) : null}
                    </FormSection>

                    <FormSection title={i18n.t('DHIS2')}>
                        <div className={classes.grid2}>
                            <Controller
                                name="connection"
                                control={form.control}
                                render={({ field, fieldState }) =>
                                    connectionOptions.length > 0 ? (
                                        <Field
                                            label={i18n.t('Connection')}
                                            required
                                            error={Boolean(fieldState.error)}
                                            validationText={
                                                fieldState.error?.message
                                            }
                                        >
                                            <SingleSelectControl
                                                name={field.name}
                                                value={field.value}
                                                options={connectionOptions}
                                                placeholder={i18n.t(
                                                    'Choose a connection'
                                                )}
                                                error={Boolean(
                                                    fieldState.error
                                                )}
                                                onChange={field.onChange}
                                            />
                                        </Field>
                                    ) : (
                                        <InputField
                                            label={i18n.t('Connection')}
                                            required
                                            placeholder={i18n.t(
                                                'Name in the geoservice config'
                                            )}
                                            name={field.name}
                                            value={field.value ?? ''}
                                            onChange={({ value }) =>
                                                field.onChange(value)
                                            }
                                            onBlur={field.onBlur}
                                            error={Boolean(fieldState.error)}
                                            validationText={
                                                fieldState.error?.message
                                            }
                                        />
                                    )
                                }
                            />
                            <DataSetSelector
                                name="dataSet"
                                label={i18n.t('Data set')}
                            />
                        </div>

                        <div className={classes.grid2}>
                            <DataElementSelector
                                name="series.0.dataElement"
                                label={i18n.t('Data element')}
                                dataSetId={dataSetId || undefined}
                            />
                            <CategoryOptionComboSelector
                                name="series.0.categoryOptionCombo"
                                dataElementName="series.0.dataElement"
                                label={i18n.t('Category option combo')}
                            />
                        </div>
                    </FormSection>
                </form>
            </FormProvider>
        )
    }

    return (
        <Modal large onClose={onClose} position="middle">
            <ModalTitle>
                {editing
                    ? i18n.t('Edit geoservice pipeline')
                    : i18n.t('New geoservice pipeline')}
            </ModalTitle>
            <ModalContent>{content}</ModalContent>
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
                        {editing ? i18n.t('Save') : i18n.t('Create')}
                    </Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    )
}
