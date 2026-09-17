import i18n from '@dhis2/d2-i18n'
import { SingleSelectField, SingleSelectOption } from '@dhis2/ui'
import React from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { DataElementSelector } from './DataElementSelector'
import classes from './ThresholdGenerationConfig.module.css'
import { ThresholdOutputsBatch } from './ThresholdOutputsBatch'
import type { PipelineStepFormWithHandlerValues } from '@/modules/pipeline-detail/schemas/stepFormSchema'
import {
    CALCULATION_METHOD_VALUES,
    calculationMethodLabel,
    DEFAULT_CALCULATION_METHOD,
    type ThresholdOutputMode,
} from '@/modules/threshold-generation/constants'
import { SegmentedControl } from '@/shared/components/ui/FormPrimitives'

const OUTPUT_MODE_OPTIONS = [
    { value: 'single' as const, label: i18n.t('Single output') },
    { value: 'batch' as const, label: i18n.t('Multiple outputs') },
]

type Props = {
    outputMode: ThresholdOutputMode
    onOutputModeChange: (mode: ThresholdOutputMode) => void
}

export function ThresholdOutputSection({
    outputMode,
    onOutputModeChange,
}: Props): React.ReactElement {
    const { control } = useFormContext<PipelineStepFormWithHandlerValues>()

    return (
        <div className={classes.outputPanel}>
            <div className={classes.outputTabs}>
                <SegmentedControl
                    name="threshold-output-mode"
                    value={outputMode}
                    options={OUTPUT_MODE_OPTIONS}
                    onChange={onOutputModeChange}
                    aria-label={i18n.t('Output configuration')}
                />
            </div>

            {outputMode === 'single' ? (
                <div className={classes.outputBody}>
                    <div className={classes.singleOutputGrid}>
                        <Controller
                            name="handlerConfig.calculationMethod"
                            control={control}
                            render={({ field, fieldState }) => (
                                <SingleSelectField
                                    label={i18n.t('Calculation method')}
                                    required
                                    selected={
                                        typeof field.value === 'string'
                                            ? field.value
                                            : DEFAULT_CALCULATION_METHOD
                                    }
                                    onChange={({ selected }) =>
                                        field.onChange(selected)
                                    }
                                    onBlur={field.onBlur}
                                    helpText={i18n.t('Default is mean + 2SD.')}
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
                                        />
                                    ))}
                                </SingleSelectField>
                            )}
                        />

                        <DataElementSelector
                            name="handlerConfig.outputDataElementId"
                            label={i18n.t('Output data element')}
                        />
                    </div>
                    <p className={classes.outputHint}>
                        {i18n.t(
                            'Maps to calculationMethod and outputDataElementId on the handler config.'
                        )}
                    </p>
                </div>
            ) : (
                <ThresholdOutputsBatch />
            )}
        </div>
    )
}
