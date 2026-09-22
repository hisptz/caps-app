import i18n from '@dhis2/d2-i18n'
import { InputField, SingleSelectField, SingleSelectOption } from '@dhis2/ui'
import React, { useMemo } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import classes from './ThresholdGenerationConfig.module.css'
import { ThresholdRepeatableFieldList } from './ThresholdRepeatableFieldList'
import type { PipelineStepFormWithHandlerValues } from '@/modules/pipeline-detail/schemas/stepFormSchema'
import {
    DEFAULT_YEARS_TO_INCLUDE,
    THRESHOLD_PERIOD_TYPE_VALUES,
    thresholdPeriodTypeLabel,
} from '@/modules/threshold-generation/constants'
import { formSectionGrids } from '@/shared/components/ui/FormPrimitives'

function parseYearsToInclude(raw: string): number {
    const parsed = Number.parseInt(raw, 10)
    if (Number.isNaN(parsed) || parsed < 1) {
        return DEFAULT_YEARS_TO_INCLUDE
    }
    return parsed
}

function clampYearsToInclude(value: unknown): number {
    if (typeof value === 'number' && Number.isInteger(value)) {
        return value < 1 ? 1 : value
    }
    return DEFAULT_YEARS_TO_INCLUDE
}

const YEAR_OPTIONS_COUNT = 20

export function ThresholdPeriodFields(): React.ReactElement {
    const { control } = useFormContext<PipelineStepFormWithHandlerValues>()

    const yearOptions = useMemo(() => {
        const currentYear = new Date().getFullYear()
        return Array.from({ length: YEAR_OPTIONS_COUNT }, (_, i) => {
            const year = String(currentYear - i)
            return { label: year, value: year }
        })
    }, [])

    return (
        <>
            <div className={formSectionGrids.grid2}>
                <Controller
                    name="handlerConfig.period.periodType"
                    control={control}
                    render={({ field, fieldState }) => (
                        <SingleSelectField
                            label={i18n.t('Period type')}
                            required
                            selected={
                                typeof field.value === 'string'
                                    ? field.value
                                    : ''
                            }
                            onChange={({ selected }) =>
                                field.onChange(selected)
                            }
                            onBlur={field.onBlur}
                            error={Boolean(fieldState.error)}
                            validationText={fieldState.error?.message}
                        >
                            {THRESHOLD_PERIOD_TYPE_VALUES.map((pt) => (
                                <SingleSelectOption
                                    key={pt}
                                    value={pt}
                                    label={thresholdPeriodTypeLabel(pt)}
                                />
                            ))}
                        </SingleSelectField>
                    )}
                />

                <Controller
                    name="handlerConfig.period.yearsToInclude"
                    control={control}
                    render={({ field, fieldState }) => (
                        <InputField
                            label={i18n.t('Years to include')}
                            type="number"
                            value={
                                field.value !== undefined &&
                                field.value !== null
                                    ? String(field.value)
                                    : String(DEFAULT_YEARS_TO_INCLUDE)
                            }
                            onChange={({ value: v }) =>
                                field.onChange(
                                    v === ''
                                        ? DEFAULT_YEARS_TO_INCLUDE
                                        : parseYearsToInclude(v!)
                                )
                            }
                            onBlur={() => {
                                field.onChange(clampYearsToInclude(field.value))
                                field.onBlur()
                            }}
                            helpText={i18n.t(
                                'Sliding history window used per calculation.'
                            )}
                            error={Boolean(fieldState.error)}
                            validationText={fieldState.error?.message}
                        />
                    )}
                />
            </div>

            <div className={classes.periodYearsBlock}>
                <ThresholdRepeatableFieldList
                    name="handlerConfig.period.years"
                    sectionLabel={i18n.t('Years')}
                    itemLabel={i18n.t('Year')}
                    addLabel={i18n.t('Add year')}
                    helpText={i18n.t('Years to generate thresholds for.')}
                    options={yearOptions}
                />
            </div>
        </>
    )
}
