import i18n from '@dhis2/d2-i18n'
import {
    Button,
    IconCross16,
    NoticeBox,
    SingleSelectField,
    SingleSelectOption,
} from '@dhis2/ui'
import React, { useMemo } from 'react'
import {
    Controller,
    useFieldArray,
    useFormContext,
    type ArrayPath,
} from 'react-hook-form'
import { DataElementSelector } from './DataElementSelector'
import sharedClasses from './HandlerConfigShared.module.css'
import type { PipelineStepFormWithHandlerValues } from '@/modules/pipeline-detail/schemas/stepFormSchema'
import {
    CALCULATION_METHOD_VALUES,
    calculationMethodLabel,
    DEFAULT_CALCULATION_METHOD,
    type ThresholdOutputSpec,
} from '@/modules/threshold-generation/constants'
import { hasDuplicateOutputMethods } from '@/modules/threshold-generation/normalizeConfig'

const OUTPUT_TABLE_GRID = '1fr 1fr 40px'

const DEFAULT_BATCH_OUTPUT: ThresholdOutputSpec = {
    calculationMethod: DEFAULT_CALCULATION_METHOD,
    outputDataElementId: '',
}

export function ThresholdOutputsBatch(): React.ReactElement {
    const { control, watch } =
        useFormContext<PipelineStepFormWithHandlerValues>()
    const outputsPath =
        'handlerConfig.outputs' as ArrayPath<PipelineStepFormWithHandlerValues>
    const { fields, append, remove } = useFieldArray({
        control,
        name: outputsPath,
    })

    const watchedOutputs = watch('handlerConfig.outputs')
    const outputsForDupCheck: ThresholdOutputSpec[] = useMemo(() => {
        if (!Array.isArray(watchedOutputs)) {
            return []
        }
        return watchedOutputs
            .map((item) => {
                if (typeof item !== 'object' || item === null) {
                    return null
                }
                const row = item as Record<string, unknown>
                const method = row.calculationMethod
                const outputDataElementId = row.outputDataElementId
                if (
                    typeof method === 'string' &&
                    typeof outputDataElementId === 'string'
                ) {
                    return {
                        calculationMethod:
                            method as ThresholdOutputSpec['calculationMethod'],
                        outputDataElementId,
                    }
                }
                return null
            })
            .filter((row): row is ThresholdOutputSpec => row !== null)
    }, [watchedOutputs])

    const duplicateMethods = hasDuplicateOutputMethods(outputsForDupCheck)

    const usedMethods = useMemo(
        () => new Set(outputsForDupCheck.map((row) => row.calculationMethod)),
        [outputsForDupCheck]
    )

    const nextAvailableMethod = CALCULATION_METHOD_VALUES.find(
        (method) => !usedMethods.has(method)
    )

    return (
        <>
            <div
                className={sharedClasses.mappingTableHead}
                style={{ gridTemplateColumns: OUTPUT_TABLE_GRID }}
            >
                <span>{i18n.t('Calculation method')}</span>
                <span>{i18n.t('Output data element')}</span>
                <span />
            </div>
            {duplicateMethods && (
                <NoticeBox
                    error
                    title={i18n.t('Duplicate calculation methods')}
                >
                    {i18n.t(
                        'Each calculation method may only be used once. Change or remove duplicate rows.'
                    )}
                </NoticeBox>
            )}
            {fields.map((row, index) => (
                <div
                    key={row.id}
                    className={sharedClasses.mappingTableRow}
                    style={{ gridTemplateColumns: OUTPUT_TABLE_GRID }}
                >
                    <Controller
                        name={
                            `handlerConfig.outputs.${index}.calculationMethod` as const
                        }
                        control={control}
                        render={({ field, fieldState }) => {
                            const selected =
                                typeof field.value === 'string'
                                    ? field.value
                                    : DEFAULT_CALCULATION_METHOD
                            return (
                                <SingleSelectField
                                    selected={selected}
                                    onChange={({ selected: next }) =>
                                        field.onChange(next)
                                    }
                                    onBlur={field.onBlur}
                                    error={Boolean(fieldState.error)}
                                    validationText={fieldState.error?.message}
                                >
                                    {CALCULATION_METHOD_VALUES.map((method) => (
                                        <SingleSelectOption
                                            key={method}
                                            value={method}
                                            label={calculationMethodLabel(
                                                method
                                            )}
                                            disabled={
                                                method !== selected &&
                                                usedMethods.has(method)
                                            }
                                        />
                                    ))}
                                </SingleSelectField>
                            )
                        }}
                    />
                    <DataElementSelector
                        name={`handlerConfig.outputs.${index}.outputDataElementId`}
                        label=""
                    />
                    <Button
                        className={sharedClasses.removeBtn}
                        secondary
                        small
                        icon={<IconCross16 />}
                        disabled={fields.length <= 1}
                        aria-label={i18n.t('Remove output')}
                        onClick={() => remove(index)}
                    />
                </div>
            ))}
            <div className={sharedClasses.mappingTableFooter}>
                <Button
                    secondary
                    small
                    disabled={!nextAvailableMethod}
                    onClick={() =>
                        append({
                            ...DEFAULT_BATCH_OUTPUT,
                            calculationMethod:
                                nextAvailableMethod ??
                                DEFAULT_BATCH_OUTPUT.calculationMethod,
                        })
                    }
                >
                    {i18n.t('Add output')}
                </Button>
                <span className={sharedClasses.footerHint}>
                    {i18n.t('Methods must be unique.')}
                </span>
            </div>
        </>
    )
}
