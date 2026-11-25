import i18n from '@dhis2/d2-i18n'
import { Field, InputField } from '@dhis2/ui'
import React, { useEffect } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { FixedPeriodFields } from '../ClimateOpenEoCreateConfig/components/ClimateDatasetPeriodSelector'
import {
    getCoverageYearRange,
    type HandlerPeriodType,
    normalizeDatasetPeriodType,
} from '../ClimateOpenEoCreateConfig/utils/climateDatasetPeriodUtils'
import {
    MAX_ROLLING_COUNT,
    type PeriodMode,
    periodForMode,
    periodModeOf,
    rollingFieldsOf,
    rollingPeriod,
    rollingWindow,
} from '../ClimateOpenEoCreateConfig/utils/climatePeriod'
import classes from './SchemaClimatePeriodField.module.css'
import { useGeoservicePipelinePeriodType } from '@/modules/geoservice-pipelines/hooks/useGeoservicePipelinePeriodType'
import {
    SegmentedControl,
    SingleSelectControl,
} from '@/shared/components/ui/FormPrimitives'

const PERIOD_TYPES: HandlerPeriodType[] = ['daily', 'weekly', 'monthly']

const PERIOD_TYPE_LABEL: Record<HandlerPeriodType, string> = {
    daily: i18n.t('Daily'),
    weekly: i18n.t('Weekly'),
    monthly: i18n.t('Monthly'),
}

const MODE_OPTIONS = [
    { value: 'rolling', label: i18n.t('Latest periods') },
    { value: 'fixed', label: i18n.t('Fixed range') },
] as const

function asPeriodType(value: unknown): HandlerPeriodType {
    return PERIOD_TYPES.includes(value as HandlerPeriodType)
        ? (value as HandlerPeriodType)
        : 'monthly'
}

function wholeNumber(value: string | undefined): number | undefined {
    const parsed = Number.parseInt(value ?? '', 10)
    return Number.isNaN(parsed) ? undefined : parsed
}

export interface SchemaClimatePeriodFieldProps {
    name: string
    label: string
    helpText?: string
    required: boolean
}

/** A period type fixed by something else on the step, shown instead of the choice. */
interface PeriodTypeLock {
    periodType?: HandlerPeriodType
    helpText: string
    error?: string
}

/** The sibling field naming the geoservice pipeline a step runs (`ocs-pipeline-run`). */
const PIPELINE_FIELD = 'pipelineId'

function siblingName(name: string, sibling: string): string {
    const parent = name.split('.').slice(0, -1).join('.')
    return parent ? `${parent}.${sibling}` : sibling
}

export function SchemaClimatePeriodField(
    props: SchemaClimatePeriodFieldProps
): React.ReactElement {
    const pipelineId = useWatch({
        name: siblingName(props.name, PIPELINE_FIELD),
    }) as unknown
    if (typeof pipelineId === 'string' && pipelineId !== '') {
        return <PipelinePeriodField {...props} pipelineId={pipelineId} />
    }
    return <ClimatePeriodFields {...props} />
}

function PipelinePeriodField({
    pipelineId,
    ...props
}: SchemaClimatePeriodFieldProps & {
    pipelineId: string
}): React.ReactElement {
    const { periodType, datasetName, isLoading } =
        useGeoservicePipelinePeriodType(pipelineId)
    const supported = normalizeDatasetPeriodType(periodType)
    let lock: PeriodTypeLock | undefined
    if (supported) {
        lock = {
            periodType: supported,
            helpText: i18n.t('From the pipeline dataset {{name}}', {
                name: datasetName ?? '',
            }),
        }
    } else if (periodType) {
        lock = {
            helpText: '',
            error: i18n.t(
                'The pipeline dataset is {{periodType}}; this step runs daily, weekly and monthly datasets only',
                { periodType }
            ),
        }
    } else if (isLoading) {
        lock = { helpText: i18n.t('Reading the pipeline dataset…') }
    }
    return <ClimatePeriodFields {...props} lock={lock} />
}

function ClimatePeriodFields({
    name,
    label,
    helpText,
    required,
    lock,
}: SchemaClimatePeriodFieldProps & {
    lock?: PeriodTypeLock
}): React.ReactElement {
    const { setValue, getFieldState, formState } = useFormContext()
    const period = useWatch({ name }) as Record<string, unknown> | undefined
    const periodType = asPeriodType(lock?.periodType ?? period?.periodType)
    const mode = periodModeOf(period)
    const { count, offset } = rollingFieldsOf(period)
    const { minYear, maxYear } = getCoverageYearRange(undefined, undefined)
    const countError = getFieldState(`${name}.count`, formState).error?.message
    const window =
        mode === 'rolling' && count !== undefined && count >= 1 && offset >= 0
            ? rollingWindow({ periodType, count, offset })
            : undefined

    function set(next: Record<string, unknown>): void {
        setValue(name, next, {
            shouldDirty: true,
            shouldValidate: formState.isSubmitted,
        })
    }

    function switchTo(nextMode: PeriodMode, nextType: HandlerPeriodType): void {
        set(periodForMode(nextMode, nextType))
    }

    const lockedType = lock?.periodType
    const storedType = period?.periodType
    useEffect(() => {
        // Keep the stored period in the locked unit; its count meant other periods before.
        if (lockedType && storedType !== lockedType) {
            setValue(name, periodForMode(mode, lockedType), {
                shouldDirty: true,
            })
        }
    }, [lockedType, storedType, mode, name, setValue])

    return (
        <Field
            label={label}
            required={required}
            helpText={
                window
                    ? i18n.t('A run today covers {{start}} – {{end}}', {
                          start: window[0],
                          end: window[1],
                          nsSeparator: '~~',
                      })
                    : helpText
            }
        >
            <div className={classes.stack}>
                <SegmentedControl
                    name={`${name}-mode`}
                    value={mode}
                    options={MODE_OPTIONS}
                    onChange={(next) => switchTo(next, periodType)}
                    aria-label={label}
                />
                <div
                    className={
                        mode === 'rolling' ? classes.rolling : classes.fixed
                    }
                >
                    {lock ? (
                        <InputField
                            label={i18n.t('Period type')}
                            name={`${name}.periodType`}
                            value={
                                lock.periodType
                                    ? PERIOD_TYPE_LABEL[lock.periodType]
                                    : ''
                            }
                            disabled
                            readOnly
                            helpText={lock.helpText || undefined}
                            error={Boolean(lock.error)}
                            validationText={lock.error}
                        />
                    ) : (
                        <Field label={i18n.t('Period type')}>
                            <SingleSelectControl
                                name={`${name}.periodType`}
                                value={periodType}
                                options={PERIOD_TYPES.map((value) => ({
                                    value,
                                    label: PERIOD_TYPE_LABEL[value],
                                }))}
                                onChange={(next) =>
                                    switchTo(mode, asPeriodType(next))
                                }
                            />
                        </Field>
                    )}
                    {mode === 'rolling' ? (
                        <>
                            <InputField
                                label={i18n.t('How many')}
                                type="number"
                                min="1"
                                max={String(MAX_ROLLING_COUNT[periodType])}
                                value={count === undefined ? '' : String(count)}
                                onChange={({ value }) =>
                                    set(
                                        rollingPeriod(
                                            periodType,
                                            wholeNumber(value),
                                            offset
                                        )
                                    )
                                }
                                error={Boolean(countError)}
                                validationText={countError}
                            />
                            <InputField
                                label={i18n.t('Skip latest')}
                                type="number"
                                min="0"
                                value={String(offset)}
                                onChange={({ value }) =>
                                    set(
                                        rollingPeriod(
                                            periodType,
                                            count,
                                            wholeNumber(value) ?? 0
                                        )
                                    )
                                }
                            />
                        </>
                    ) : (
                        <FixedPeriodFields
                            name={name}
                            datasetId={periodType}
                            periodType={periodType}
                            temporalExtent={undefined}
                            minYear={minYear}
                            maxYear={maxYear}
                        />
                    )}
                </div>
            </div>
        </Field>
    )
}
