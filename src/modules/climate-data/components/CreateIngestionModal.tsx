import i18n from '@dhis2/d2-i18n'
import {
    Button,
    ButtonStrip,
    Modal,
    ModalActions,
    ModalContent,
    ModalTitle,
    NoticeBox,
    SimpleSingleSelectField,
    SwitchField,
} from '@dhis2/ui'
import { zodResolver } from '@hookform/resolvers/zod'
import type { UseMutationResult } from '@tanstack/react-query'
import { capitalize } from 'lodash-es'
import React from 'react'
import { Controller, FormProvider, useForm, useWatch } from 'react-hook-form'
import classes from './ClimateDataModals.module.css'
import type { CapsDataEngine } from '@/capsApi/client'
import type {
    ClimateDatasetTemplate,
    CreateClimateIngestionRequest,
} from '@/capsApi/types'
import { IngestionPeriodSelector } from '@/modules/climate-data/components/IngestionPeriodSelector'
import {
    isAsyncJobAccepted,
    mapClimateMutationError,
} from '@/modules/climate-data/hooks/useClimateIngestionMutations'
import {
    defaultIngestionFormValues,
    ingestionFormSchema,
    type IngestionFormValues,
} from '@/modules/climate-data/schemas/ingestionFormSchema'
import { resolvePeriodScope } from '@/modules/climate-data/utils/periodScope'
import { isFutureTemplate } from '@/modules/climate-data/utils/template'

type Props = {
    open: boolean
    onClose: () => void
    engine: CapsDataEngine
    templates: ClimateDatasetTemplate[]
    templatesLoading: boolean
    createMutation: UseMutationResult<
        unknown,
        unknown,
        CreateClimateIngestionRequest,
        unknown
    >
    onJobAccepted: (jobId: string, datasetId?: string) => void
}

export function CreateIngestionModal({
    open,
    onClose,
    templates,
    templatesLoading,
    createMutation,
    onJobAccepted,
}: Props): React.ReactElement | null {
    const form = useForm<IngestionFormValues>({
        resolver: zodResolver(ingestionFormSchema),
        defaultValues: defaultIngestionFormValues,
        mode: 'onBlur',
    })

    const datasetId = useWatch({ control: form.control, name: 'dataset_id' })
    const selectedTemplate = templates.find((t) => t.id === datasetId)
    const futureTemplate = isFutureTemplate(selectedTemplate)

    const rootError = form.formState.errors.root?.message

    const templateOptions = templates.map((t) => ({
        label: `${t.name} (${capitalize(t.period_type)})`,
        value: t.id,
    }))

    function onSubmit(values: IngestionFormValues) {
        const body: CreateClimateIngestionRequest = {
            dataset_id: values.dataset_id,
            overwrite: values.overwrite,
            publish: values.publish,
        }

        if (!isFutureTemplate(selectedTemplate)) {
            const { start, end } = resolvePeriodScope(values.periodIds)
            body.start = start
            body.end = end
        }

        createMutation.mutate(body, {
            onSuccess: (result) => {
                if (isAsyncJobAccepted(result)) {
                    onJobAccepted(result.jobId, values.dataset_id)
                    return
                }
                onClose()
            },
            onError: (err) => {
                form.setError('root', {
                    type: 'server',
                    message: mapClimateMutationError(err),
                })
            },
        })
    }

    if (!open) {
        return null
    }

    return (
        <Modal large onClose={onClose} position="middle">
            <ModalTitle>{i18n.t('New dataset')}</ModalTitle>
            <ModalContent>
                <p className={classes.subtitle}>
                    {i18n.t(
                        'Create a managed dataset by ingesting data from a template.'
                    )}
                </p>
                <FormProvider {...form}>
                    <form
                        id="create-ingestion-form"
                        className={classes.formStack}
                        onSubmit={form.handleSubmit(onSubmit)}
                    >
                        {rootError && (
                            <NoticeBox
                                error
                                title={i18n.t('Could not start ingestion')}
                            >
                                {rootError}
                            </NoticeBox>
                        )}
                        <Controller
                            name="dataset_id"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <SimpleSingleSelectField
                                    name="dataset_id"
                                    label={i18n.t('Dataset template')}
                                    required
                                    loading={templatesLoading}
                                    value={field.value || undefined}
                                    options={templateOptions}
                                    onChange={(value) => {
                                        field.onChange(value ?? '')
                                        form.setValue('periodIds', [])
                                        const template = templates.find(
                                            (t) => t.id === value
                                        )
                                        form.setValue(
                                            'temporalDirection',
                                            template?.temporal_direction
                                        )
                                    }}
                                    error={Boolean(fieldState.error)}
                                    validationText={fieldState.error?.message}
                                />
                            )}
                        />
                        {futureTemplate ? (
                            <p className={classes.hint}>
                                {i18n.t(
                                    'This forecast template starts from now. Period selection is not required.'
                                )}
                            </p>
                        ) : (
                            <IngestionPeriodSelector />
                        )}
                        <Controller
                            name="overwrite"
                            control={form.control}
                            render={({ field }) => (
                                <SwitchField
                                    label={i18n.t('Overwrite existing dataset')}
                                    checked={field.value}
                                    onChange={({ checked }) =>
                                        field.onChange(checked)
                                    }
                                />
                            )}
                        />
                    </form>
                </FormProvider>
            </ModalContent>
            <ModalActions>
                <ButtonStrip end>
                    <Button onClick={onClose}>{i18n.t('Cancel')}</Button>
                    <Button
                        primary
                        type="submit"
                        form="create-ingestion-form"
                        loading={createMutation.isPending}
                        disabled={createMutation.isPending}
                    >
                        {i18n.t('Start ingestion')}
                    </Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    )
}
