import { useAlert, useDataEngine } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import { Button, ButtonStrip, IconArrowLeft16, NoticeBox } from '@dhis2/ui'
import { zodResolver } from '@hookform/resolvers/zod'
import React, { useEffect, useMemo, useState } from 'react'
import { FormProvider, useForm, useWatch } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router'
import { useDebounceValue } from 'usehooks-ts'
import { BackfillSection } from './components/BackfillSection'
import { BasicsSection } from './components/BasicsSection'
import { ClimateSection, DiseaseSection } from './components/DataSections'
import {
    OrgUnitsSection,
    PredictionSection,
} from './components/PredictionSection'
import { TemplatePreviewPanel } from './components/TemplatePreviewPanel'
import classes from './WorkflowTemplatePage.module.css'
import { CapsApiError } from '@/capsApi/client'
import {
    useTemplateMutations,
    useTemplatePreviewQuery,
    useWorkflowQuery,
    useWorkflowTemplateSetupQuery,
    useWorkflowTemplatesQuery,
} from '@/modules/workflows/hooks/useWorkflows'
import {
    defaultTemplateFormValues,
    formFieldForIssue,
    paramsToTemplateFormValues,
    templateFormSchema,
    templateFormValuesToBackfill,
    templateFormValuesToParams,
    type TemplateFormValues,
} from '@/modules/workflows/schemas/templateFormSchema'
import pageClasses from '@/pages/PipelineDetailPage/PipelineDetailPage.module.css'
import { PageLoader } from '@/shared/components/ui/PageLoader'
import shellClasses from '@/shared/components/ui/PageShell/PageShell.module.css'
import type { TemplateIssue, WorkflowTemplateSetup } from '@/shared/types/caps'

const FORM_ID = 'workflow-template-form'

type ErrorBody = {
    code?: string
    details?: {
        errors?: TemplateIssue[]
        editedPipelines?: WorkflowTemplateSetup['editedPipelines']
    }
}

function errorBody(err: unknown): ErrorBody | undefined {
    return err instanceof CapsApiError && typeof err.body === 'object'
        ? (err.body as ErrorBody)
        : undefined
}

const WorkflowTemplatePage: React.FC = () => {
    const { template: templateParam, id } = useParams<{
        template?: string
        id?: string
    }>()
    const editing = Boolean(id)
    const engine = useDataEngine()
    const navigate = useNavigate()
    const { show } = useAlert(
        ({ message }) => message,
        ({ type }) => ({ ...type, duration: 6000 })
    )

    const workflowQuery = useWorkflowQuery(engine, id)
    const setupQuery = useWorkflowTemplateSetupQuery(engine, id, editing)
    const templatesQuery = useWorkflowTemplatesQuery(engine)
    const template = templateParam ?? setupQuery.data?.template
    const templateInfo = templatesQuery.data?.find((t) => t.id === template)
    const { createFromTemplateMutation, updateSetupMutation } =
        useTemplateMutations(engine)
    const [edited, setEdited] = useState<
        WorkflowTemplateSetup['editedPipelines'] | null
    >(null)

    const form = useForm<TemplateFormValues>({
        resolver: zodResolver(templateFormSchema),
        defaultValues: defaultTemplateFormValues(),
    })

    useEffect(() => {
        if (setupQuery.data) {
            form.reset(paramsToTemplateFormValues(setupQuery.data.params))
            form.clearErrors()
        }
    }, [setupQuery.data, form])

    const values = useWatch({ control: form.control })
    const [settled] = useDebounceValue(values, 600)
    const params = useMemo(() => {
        const parsed = templateFormSchema.safeParse(settled)
        return parsed.success ? templateFormValuesToParams(parsed.data) : null
    }, [settled])
    const preview = useTemplatePreviewQuery(
        engine,
        template ?? '',
        template ? params : null
    )

    const showIssues = (issues: TemplateIssue[]) => {
        const general: string[] = []
        for (const issue of issues) {
            const field = formFieldForIssue(issue)
            if (field) {
                form.setError(field as keyof TemplateFormValues, {
                    message: issue.message,
                })
            } else {
                general.push(issue.message)
            }
        }
        if (general.length > 0) {
            form.setError('root', { message: general.join(' ') })
        }
    }

    const onError = (err: unknown, fallback: string) => {
        const body = errorBody(err)
        if (body?.code === 'template_edited' && body.details?.editedPipelines) {
            setEdited(body.details.editedPipelines)
            return
        }
        if (body?.details?.errors) {
            showIssues(body.details.errors)
            return
        }
        form.setError('root', {
            message: err instanceof Error ? err.message : fallback,
        })
    }

    const submit = (force: boolean) =>
        form.handleSubmit((formValues) => {
            setEdited(null)
            const body = { params: templateFormValuesToParams(formValues) }
            if (editing && id) {
                updateSetupMutation.mutate(
                    { id, body: { ...body, force } },
                    {
                        onSuccess: () => {
                            show({
                                message: i18n.t('Workflow setup updated'),
                                type: { success: true },
                            })
                            navigate(`/workflows/${id}`)
                        },
                        onError: (err) =>
                            onError(err, i18n.t('Could not update the setup')),
                    }
                )
                return
            }
            createFromTemplateMutation.mutate(
                {
                    template: template!,
                    body: {
                        ...body,
                        backfill: templateFormValuesToBackfill(formValues),
                    },
                },
                {
                    onSuccess: ({ workflow, backfillRun }) => {
                        show({
                            message: backfillRun
                                ? i18n.t(
                                      'Workflow created; backfilling history now'
                                  )
                                : i18n.t('Workflow created'),
                            type: { success: true },
                        })
                        navigate(`/workflows/${workflow.id}`)
                    },
                    onError: (err) =>
                        onError(err, i18n.t('Could not create the workflow')),
                }
            )
        })

    if (editing && (workflowQuery.isLoading || setupQuery.isLoading)) {
        return <PageLoader />
    }
    if (editing && (setupQuery.isError || workflowQuery.isError)) {
        const err = setupQuery.error ?? workflowQuery.error
        return (
            <div className={shellClasses.pageRoot}>
                <NoticeBox error title={i18n.t('Could not load the setup')}>
                    {err instanceof Error ? err.message : null}
                </NoticeBox>
            </div>
        )
    }
    if (!editing && templatesQuery.data && !templateInfo) {
        return (
            <div className={shellClasses.pageRoot}>
                <NoticeBox error title={i18n.t('Template not found')} />
            </div>
        )
    }

    const pending =
        createFromTemplateMutation.isPending || updateSetupMutation.isPending
    const back = editing ? `/workflows/${id}` : '/workflows'
    const rootError = form.formState.errors.root?.message

    return (
        <div className={shellClasses.pageRoot}>
            <div className={pageClasses.breadcrumb}>
                <Button
                    small
                    icon={<IconArrowLeft16 />}
                    onClick={() => navigate(back)}
                >
                    {editing
                        ? (workflowQuery.data?.name ?? i18n.t('Workflow'))
                        : i18n.t('Workflows')}
                </Button>
            </div>
            <div className={pageClasses.header}>
                <div>
                    <h2>
                        {editing
                            ? i18n.t('Edit setup')
                            : i18n.t('New workflow from {{template}}', {
                                  template: templateInfo?.name ?? '',
                              })}
                    </h2>
                    {templateInfo && (
                        <p className={pageClasses.description}>
                            {templateInfo.description}
                        </p>
                    )}
                </div>
            </div>

            {editing && setupQuery.data?.editedPipelines.length ? (
                <NoticeBox warning title={i18n.t('Changed by hand')}>
                    {i18n.t(
                        'Saving replaces changes made to {{names}} since the setup made them.',
                        {
                            names: setupQuery.data.editedPipelines
                                .map((p) => p.name)
                                .join(', '),
                        }
                    )}
                </NoticeBox>
            ) : null}

            <div className={classes.layout}>
                <FormProvider {...form}>
                    <form
                        id={FORM_ID}
                        className={classes.form}
                        onSubmit={submit(false)}
                    >
                        <BasicsSection />
                        <PredictionSection />
                        <OrgUnitsSection />
                        <ClimateSection />
                        <DiseaseSection />
                        {!editing && <BackfillSection />}

                        {rootError && (
                            <NoticeBox error title={i18n.t('Not saved')}>
                                {rootError}
                            </NoticeBox>
                        )}
                        {edited && (
                            <NoticeBox
                                warning
                                title={i18n.t('Pipelines changed by hand')}
                            >
                                <p className={classes.noticeText}>
                                    {i18n.t(
                                        'Saving replaces the steps of {{names}}.',
                                        {
                                            names: edited
                                                .map((p) => p.name)
                                                .join(', '),
                                        }
                                    )}
                                </p>
                                <Button
                                    small
                                    destructive
                                    loading={pending}
                                    onClick={() => submit(true)()}
                                >
                                    {i18n.t('Replace their changes')}
                                </Button>
                            </NoticeBox>
                        )}

                        <ButtonStrip>
                            <Button
                                primary
                                type="submit"
                                form={FORM_ID}
                                loading={pending}
                                disabled={Boolean(
                                    preview.data?.errors.length &&
                                    params !== null
                                )}
                            >
                                {editing
                                    ? i18n.t('Save setup')
                                    : i18n.t('Create workflow')}
                            </Button>
                            <Button onClick={() => navigate(back)}>
                                {i18n.t('Cancel')}
                            </Button>
                        </ButtonStrip>
                    </form>
                </FormProvider>
                <TemplatePreviewPanel
                    preview={params ? preview.data : undefined}
                    checking={preview.isFetching}
                    incomplete={params === null}
                />
            </div>
        </div>
    )
}

export default WorkflowTemplatePage
