import { useDataEngine } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import {
    Button,
    CalendarInput,
    MultiSelectField,
    MultiSelectOption,
    NoticeBox,
} from '@dhis2/ui'
import React, { useEffect, useMemo, useState } from 'react'
import { Controller, useFormContext, useWatch } from 'react-hook-form'
import { useParams } from 'react-router'
import { PollingFields } from '../PollingFields'
import classes from './OpenClimateServiceSyncConfig.module.css'
import { SyncPlanPreview } from './SyncPlanPreview'
import { isUuid } from '@/capsApi/isUuid'
import { useClimateDatasetsQuery } from '@/modules/climate-data/hooks/useClimateDatasetsQuery'
import { usePipelineDetailQuery } from '@/modules/monitoring/hooks/capsMonitoringHooks'
import {
    CLIMATE_SYNC_MIN_POLL_INTERVAL_MS,
    defaultOpenClimateServiceSyncConfig,
    isOpenClimateServiceSyncConfigShape,
} from '@/modules/open-climate-service-sync/schemas/config'
import { getPipelineClimateDatasetIds } from '@/modules/open-climate-service-sync/utils/syncCoverage'
import type { PipelineStepFormWithHandlerValues } from '@/modules/pipeline-detail/schemas/stepFormSchema'
import {
    FormSection,
    SegmentedControl,
} from '@/shared/components/ui/FormPrimitives'

export interface OpenClimateServiceSyncConfigProps {
    value: Record<string, unknown> | null
    onChange: (v: Record<string, unknown>) => void
}

const EMPTY: string[] = []

export function OpenClimateServiceSyncConfig({
    value,
    onChange,
}: OpenClimateServiceSyncConfigProps): React.ReactElement {
    const engine = useDataEngine()
    const { control, getValues, setValue } =
        useFormContext<PipelineStepFormWithHandlerValues>()
    const [showAdvanced, setShowAdvanced] = useState(false)

    const { id } = useParams<{ id: string }>()
    const idReady = isUuid(id)
    const pipelineQuery = usePipelineDetailQuery(engine, id, idReady)
    const pipelineDatasetIds = useMemo(
        () => getPipelineClimateDatasetIds(pipelineQuery.data?.steps ?? []),
        [pipelineQuery.data]
    )
    const pipelineSettled = !idReady || !pipelineQuery.isLoading

    const datasetsQuery = useClimateDatasetsQuery(engine)
    const datasets = datasetsQuery.data?.items ?? []
    const datasetNames = useMemo(
        () =>
            new Map(
                datasets.map((d) => [
                    d.dataset_id,
                    d.short_name ?? d.dataset_name,
                ])
            ),
        [datasets]
    )

    useEffect(() => {
        if (!pipelineSettled) {
            return
        }
        const raw = getValues('handlerConfig') ?? value
        if (!isOpenClimateServiceSyncConfigShape(raw)) {
            const defaults =
                defaultOpenClimateServiceSyncConfig(pipelineDatasetIds)
            setValue('handlerConfig', defaults, { shouldDirty: true })
            onChange(defaults)
        }
    }, [pipelineSettled, pipelineDatasetIds])

    const watchedIds = useWatch({ control, name: 'handlerConfig.datasetIds' })
    const selectedIds = Array.isArray(watchedIds)
        ? (watchedIds as string[])
        : EMPTY
    const missingIds = pipelineDatasetIds.filter(
        (d) => !selectedIds.includes(d)
    )

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <FormSection
                title={i18n.t('Datasets')}
                description={i18n.t(
                    'Brought up to date before later steps read them'
                )}
                tight
            >
                {datasetsQuery.error ? (
                    <NoticeBox
                        error
                        title={i18n.t('Could not load climate datasets')}
                    >
                        {i18n.t('Check CLIMATE_API_BASE_URL configuration.')}
                    </NoticeBox>
                ) : (
                    <Controller
                        name="handlerConfig.datasetIds"
                        control={control}
                        render={({ field, fieldState }) => (
                            <MultiSelectField
                                label={i18n.t('Climate datasets')}
                                required
                                loading={datasetsQuery.isLoading}
                                selected={
                                    datasetsQuery.data
                                        ? selectedIds.filter((d) =>
                                              datasetNames.has(d)
                                          )
                                        : []
                                }
                                onChange={({ selected }) =>
                                    field.onChange(selected)
                                }
                                onBlur={field.onBlur}
                                error={Boolean(fieldState.error)}
                                validationText={fieldState.error?.message}
                                helpText={i18n.t(
                                    'Datasets already up to date are skipped, so syncing on every run costs nothing.'
                                )}
                            >
                                {datasets.map((d) => (
                                    <MultiSelectOption
                                        key={d.dataset_id}
                                        value={d.dataset_id}
                                        label={
                                            pipelineDatasetIds.includes(
                                                d.dataset_id
                                            )
                                                ? i18n.t(
                                                      '{{name}} (used by this pipeline)',
                                                      {
                                                          name:
                                                              d.short_name ??
                                                              d.dataset_name,
                                                      }
                                                  )
                                                : (d.short_name ??
                                                  d.dataset_name)
                                        }
                                    />
                                ))}
                            </MultiSelectField>
                        )}
                    />
                )}

                {missingIds.length > 0 && datasetsQuery.data && (
                    <NoticeBox
                        warning
                        title={i18n.t(
                            'Some datasets this pipeline reads are not selected'
                        )}
                    >
                        <div className={classes.pipelineNotice}>
                            <span>
                                {missingIds
                                    .map((d) => datasetNames.get(d) ?? d)
                                    .join(', ')}
                            </span>
                            <Button
                                small
                                type="button"
                                onClick={() =>
                                    setValue(
                                        'handlerConfig.datasetIds',
                                        [...selectedIds, ...missingIds],
                                        {
                                            shouldDirty: true,
                                            shouldValidate: true,
                                        }
                                    )
                                }
                            >
                                {i18n.t('Add them')}
                            </Button>
                        </div>
                    </NoticeBox>
                )}

                <SyncPlanPreview
                    datasetIds={selectedIds.filter((d) => datasetNames.has(d))}
                    datasetNames={datasetNames}
                />
            </FormSection>

            <FormSection title={i18n.t('If a dataset fails to sync')} tight>
                <Controller
                    name="handlerConfig.onFailure"
                    control={control}
                    render={({ field }) => (
                        <SegmentedControl
                            aria-label={i18n.t('If a dataset fails to sync')}
                            value={
                                field.value === 'continue' ? 'continue' : 'fail'
                            }
                            onChange={field.onChange}
                            options={[
                                {
                                    value: 'fail',
                                    label: i18n.t('Stop the pipeline'),
                                },
                                {
                                    value: 'continue',
                                    label: i18n.t(
                                        'Continue with existing data'
                                    ),
                                },
                            ]}
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
                <>
                    <FormSection
                        title={i18n.t('Sync until')}
                        description={i18n.t(
                            'Leave blank to sync to the latest available data'
                        )}
                        tight
                    >
                        <Controller
                            name="handlerConfig.end"
                            control={control}
                            render={({ field, fieldState }) => (
                                <CalendarInput
                                    label={i18n.t('Last date')}
                                    placeholder={i18n.t('Latest available')}
                                    calendar="gregory"
                                    format="YYYY-MM-DD"
                                    clearable
                                    date={
                                        typeof field.value === 'string'
                                            ? field.value
                                            : ''
                                    }
                                    onDateSelect={(selected) =>
                                        field.onChange(
                                            selected?.calendarDateString ||
                                                undefined
                                        )
                                    }
                                    onBlur={field.onBlur}
                                    error={Boolean(fieldState.error)}
                                    validationText={fieldState.error?.message}
                                />
                            )}
                        />
                    </FormSection>
                    <FormSection
                        title={i18n.t('Polling')}
                        description={i18n.t(
                            'How CAPS waits for queued sync jobs. Keep the total under 30 minutes.'
                        )}
                        tight
                    >
                        <PollingFields
                            minPollIntervalMs={
                                CLIMATE_SYNC_MIN_POLL_INTERVAL_MS
                            }
                        />
                    </FormSection>
                </>
            )}
        </div>
    )
}
