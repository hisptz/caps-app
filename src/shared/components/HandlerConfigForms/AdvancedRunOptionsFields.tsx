import i18n from '@dhis2/d2-i18n'
import { CheckboxField } from '@dhis2/ui'
import React from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import type { PipelineStepFormWithHandlerValues } from '@/modules/pipeline-detail/schemas/stepFormSchema'
import { formSectionGrids } from '@/shared/components/ui/FormPrimitives'

const SKIP_OPTIONS: Array<{
    name: `handlerConfig.runOptions.${string}`
    label: string
}> = [
    {
        name: 'handlerConfig.runOptions.skipAggregate',
        label: i18n.t('Skip aggregate'),
    },
    {
        name: 'handlerConfig.runOptions.skipEnrollment',
        label: i18n.t('Skip enrollment'),
    },
    {
        name: 'handlerConfig.runOptions.skipEvents',
        label: i18n.t('Skip events'),
    },
    {
        name: 'handlerConfig.runOptions.skipOrgUnitOwnership',
        label: i18n.t('Skip organisation unit ownership'),
    },
    {
        name: 'handlerConfig.runOptions.skipOutliers',
        label: i18n.t('Skip outliers'),
    },
    {
        name: 'handlerConfig.runOptions.skipResourceTables',
        label: i18n.t('Skip resource tables'),
    },
    {
        name: 'handlerConfig.runOptions.skipTrackedEntities',
        label: i18n.t('Skip tracked entities'),
    },
    {
        name: 'handlerConfig.runOptions.skipValidationResult',
        label: i18n.t('Skip validation results'),
    },
]

export function AdvancedRunOptionsFields(): React.ReactElement {
    const { control } = useFormContext<PipelineStepFormWithHandlerValues>()

    return (
        <div style={{ marginTop: 12 }}>
            <div
                className={formSectionGrids.grid2}
                style={{ alignItems: 'start' }}
            >
                {SKIP_OPTIONS.map(({ name, label }) => (
                    <Controller
                        key={name}
                        name={name}
                        control={control}
                        render={({ field }) => (
                            <CheckboxField
                                label={label}
                                checked={field.value === true}
                                onChange={({ checked }) =>
                                    field.onChange(checked)
                                }
                            />
                        )}
                    />
                ))}
            </div>
        </div>
    )
}
