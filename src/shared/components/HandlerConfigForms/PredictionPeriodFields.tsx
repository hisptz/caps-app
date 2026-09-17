import i18n from '@dhis2/d2-i18n'
import { InputField, SimpleSingleSelectField } from '@dhis2/ui'
import React, { useEffect } from 'react'
import { useController } from 'react-hook-form'
import { get, set } from './configHelpers'
import { ConfigLabeledControl } from './ConfigLabeledControl'
import { useSelectedModel } from '@/shared/components/HandlerConfigForms/PredictionTriggerConfig/hooks/useSelectedModel'
import { formSectionGrids } from '@/shared/components/ui/FormPrimitives'

const PERIOD_TYPE_OPTIONS = [
    { value: 'WEEKLY', label: i18n.t('Weekly') },
    { value: 'MONTHLY', label: i18n.t('Monthly') },
]

export function PredictionPeriodFields(): React.ReactElement {
    const { field } = useController({
        name: 'handlerConfig.period',
    })
    const selectedModel = useSelectedModel()

    useEffect(() => {
        if (selectedModel) {
            const modelType = selectedModel.supportedPeriodType
            switch (modelType) {
                case 'month':
                    field.onChange(set(field.value, 'type', 'MONTHLY'))
                    break
                case 'week':
                    field.onChange(set(field.value, 'type', 'WEEKLY'))
                    break
                default:
                    break
            }
        }
    }, [selectedModel])

    return (
        <div className={formSectionGrids.grid2}>
            <ConfigLabeledControl label={i18n.t('Period type')} required>
                <SimpleSingleSelectField
                    label=""
                    value={get(field.value, 'type') || undefined}
                    name="periodType"
                    options={PERIOD_TYPE_OPTIONS}
                    onChange={(selected) => {
                        field.onChange(set(field.value, 'type', selected))
                    }}
                />
            </ConfigLabeledControl>
            <InputField
                label={i18n.t('Period offset')}
                type="number"
                helpText={i18n.t(
                    'Periods to shift from today’s period. 0 = current.'
                )}
                value={get(field.value, 'periodOffset')}
                onChange={({ value: v }) =>
                    field.onChange(set(field.value, 'periodOffset', Number(v)))
                }
            />
            <InputField
                label={i18n.t('Number of previous years to include')}
                type="number"
                helpText={i18n.t('History window for the model.')}
                value={get(field.value, 'numberPreviousYearsToInclude')}
                onChange={({ value: v }) =>
                    field.onChange(
                        set(
                            field.value,
                            'numberPreviousYearsToInclude',
                            Number(v)
                        )
                    )
                }
            />
            <InputField
                label={i18n.t('Number of periods to generate')}
                type="number"
                helpText={i18n.t('Forecast horizon.')}
                value={get(field.value, 'numberOfPeriodsToGenerate')}
                onChange={({ value: v }) =>
                    field.onChange(
                        set(field.value, 'numberOfPeriodsToGenerate', Number(v))
                    )
                }
            />
        </div>
    )
}
