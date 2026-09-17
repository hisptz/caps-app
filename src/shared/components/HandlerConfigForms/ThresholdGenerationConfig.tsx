import i18n from '@dhis2/d2-i18n'
import { SingleSelectField, SingleSelectOption } from '@dhis2/ui'
import React, { useEffect, useMemo } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { OrganisationUnitConfigSection } from './OrganisationUnitConfigSection'
import { ThresholdDataElementIdsList } from './ThresholdDataElementIdsList'
import classes from './ThresholdGenerationConfig.module.css'
import { ThresholdOutputSection } from './ThresholdOutputSection'
import { ThresholdPeriodFields } from './ThresholdPeriodFields'
import type { PipelineStepFormWithHandlerValues } from '@/modules/pipeline-detail/schemas/stepFormSchema'
import {
    DEFAULT_AGGREGATION_TYPE,
    DEFAULT_CALCULATION_METHOD,
    type ThresholdOutputMode,
    type ThresholdOutputSpec,
} from '@/modules/threshold-generation/constants'
import {
    emitThresholdConfig,
    getOutputMode,
    normalizeThresholdConfigForLoad,
} from '@/modules/threshold-generation/normalizeConfig'
import { FormSection } from '@/shared/components/ui/FormPrimitives'

export interface ThresholdGenerationConfigProps {
    value: Record<string, unknown> | null
    onChange: (v: Record<string, unknown>) => void
}

const DEFAULT_BATCH_OUTPUT: ThresholdOutputSpec = {
    calculationMethod: DEFAULT_CALCULATION_METHOD,
    outputDataElementId: '',
}

function ensureEditableLists(
    config: Record<string, unknown>
): Record<string, unknown> {
    const next = { ...config }
    const period =
        typeof next.period === 'object' && next.period !== null
            ? { ...(next.period as Record<string, unknown>) }
            : {}
    const years = Array.isArray(period.years) ? [...period.years] : []
    if (years.length === 0) {
        period.years = ['']
    }
    next.period = period

    const dataElementIds = Array.isArray(next.dataElementIds)
        ? [...next.dataElementIds]
        : []
    if (dataElementIds.length === 0) {
        next.dataElementIds = ['']
    } else {
        next.dataElementIds = dataElementIds
    }

    const mode = getOutputMode(next)
    if (mode === 'batch') {
        const outputs = Array.isArray(next.outputs) ? [...next.outputs] : []
        if (outputs.length === 0) {
            next.outputs = [{ ...DEFAULT_BATCH_OUTPUT }]
        }
    }

    return next
}

export function ThresholdGenerationConfig({
    value,
    onChange,
}: ThresholdGenerationConfigProps): React.ReactElement {
    const { control, setValue, watch, getValues } =
        useFormContext<PipelineStepFormWithHandlerValues>()

    const handlerConfig = watch('handlerConfig') as
        | Record<string, unknown>
        | null
        | undefined

    const outputMode: ThresholdOutputMode = useMemo(
        () => getOutputMode(handlerConfig ?? value),
        [handlerConfig, value]
    )

    useEffect(() => {
        const raw = getValues('handlerConfig') ?? value
        const normalized = normalizeThresholdConfigForLoad(
            raw as Record<string, unknown> | null
        )
        const mode = getOutputMode(normalized)
        let next = emitThresholdConfig(normalized, mode)
        next = ensureEditableLists(next)
        setValue('handlerConfig', next, { shouldDirty: false })
        onChange(next)
    }, [])

    function publishConfig(
        draft: Record<string, unknown>,
        mode: ThresholdOutputMode = outputMode
    ): void {
        const next = emitThresholdConfig(draft, mode)
        setValue('handlerConfig', next, {
            shouldDirty: true,
            shouldValidate: true,
        })
        onChange(next)
    }

    function handleOutputModeChange(mode: ThresholdOutputMode): void {
        const base = normalizeThresholdConfigForLoad(
            (getValues('handlerConfig') ?? value) as Record<
                string,
                unknown
            > | null
        )
        publishConfig(base, mode)
    }

    return (
        <>
            <div className={classes.aggregationRow}>
                <Controller
                    name="handlerConfig.aggregationType"
                    control={control}
                    render={({ field, fieldState }) => (
                        <SingleSelectField
                            label={i18n.t('Aggregation type')}
                            selected={
                                typeof field.value === 'string' &&
                                field.value.trim()
                                    ? field.value
                                    : DEFAULT_AGGREGATION_TYPE
                            }
                            onChange={({ selected }) =>
                                field.onChange(selected)
                            }
                            onBlur={field.onBlur}
                            error={Boolean(fieldState.error)}
                            validationText={fieldState.error?.message}
                        >
                            <SingleSelectOption
                                value="SUM"
                                label={i18n.t('Sum')}
                            />
                            <SingleSelectOption
                                value="MEAN"
                                label={i18n.t('Average')}
                            />
                        </SingleSelectField>
                    )}
                />
            </div>

            <FormSection title={i18n.t('Organisation units')} tight>
                <OrganisationUnitConfigSection />
            </FormSection>

            <FormSection
                title={i18n.t('Period')}
                description={i18n.t(
                    'Period type, history window, and explicit years'
                )}
                tight
            >
                <ThresholdPeriodFields />
            </FormSection>

            <FormSection
                title={i18n.t('Source data elements')}
                description={i18n.t('Input data elements')}
                tight
            >
                <ThresholdDataElementIdsList
                    sectionLabel={i18n.t('Data element')}
                    itemLabel={i18n.t('Data element')}
                    addLabel={i18n.t('Add data element')}
                />
            </FormSection>

            <FormSection
                title={i18n.t('Output')}
                description={i18n.t('Pick simple OR advanced')}
                tight
            >
                <ThresholdOutputSection
                    outputMode={outputMode}
                    onOutputModeChange={handleOutputModeChange}
                />
            </FormSection>
        </>
    )
}
