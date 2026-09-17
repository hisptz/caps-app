import i18n from '@dhis2/d2-i18n'
import { InputField } from '@dhis2/ui'
import React from 'react'
import { useController } from 'react-hook-form'
import { get, set } from '../HandlerConfigForms/configHelpers'
import { ConfigLabeledControl } from '../HandlerConfigForms/ConfigLabeledControl'
import { OrgUnitSection } from '../HandlerConfigForms/OrgUnitSection'
import {
    FormSection,
    formSectionGrids,
    SegmentedControl,
} from '@/shared/components/ui/FormPrimitives'

export interface PredictionTriggerContextFormProps {
    stepId: string
}

const PERIOD_TYPE_OPTIONS = [
    { value: 'WEEKLY', label: i18n.t('Weekly') },
    { value: 'MONTHLY', label: i18n.t('Monthly') },
] as const

export function PredictionTriggerContextForm({
    stepId,
}: PredictionTriggerContextFormProps): React.ReactElement {
    const { field } = useController({
        name: `stepContexts.${stepId}`,
    })

    const value = field.value as Record<string, unknown> | null
    const onChange = field.onChange

    const periodType = get(value, 'period.type') || 'MONTHLY'

    function handleOrgUnitChange(orgUnit: Record<string, unknown>): void {
        onChange({ ...(value ?? {}), ...orgUnit })
    }

    return (
        <>
            <FormSection
                title={i18n.t('Organisation units')}
                description={i18n.t('Override org units for this run')}
                tight
            >
                <OrgUnitSection value={value} onChange={handleOrgUnitChange} />
            </FormSection>
            <FormSection title={i18n.t('Period')} tight>
                <div className={formSectionGrids.grid2}>
                    <ConfigLabeledControl
                        label={i18n.t('Period type')}
                        required
                    >
                        <SegmentedControl
                            name="prediction-context-period-type"
                            value={periodType}
                            options={PERIOD_TYPE_OPTIONS}
                            onChange={(selected) =>
                                onChange(set(value, 'period.type', selected))
                            }
                            aria-label={i18n.t('Period type')}
                        />
                    </ConfigLabeledControl>
                    <InputField
                        label={i18n.t('Period offset')}
                        type="number"
                        value={get(value, 'period.periodOffset')}
                        onChange={({ value: v }) =>
                            onChange(
                                set(value, 'period.periodOffset', Number(v))
                            )
                        }
                    />
                    <InputField
                        label={i18n.t('Number of previous years to include')}
                        type="number"
                        value={get(
                            value,
                            'period.numberPreviousYearsToInclude'
                        )}
                        onChange={({ value: v }) =>
                            onChange(
                                set(
                                    value,
                                    'period.numberPreviousYearsToInclude',
                                    Number(v)
                                )
                            )
                        }
                    />
                    <InputField
                        label={i18n.t('Number of periods to generate')}
                        type="number"
                        value={get(value, 'period.numberOfPeriodsToGenerate')}
                        onChange={({ value: v }) =>
                            onChange(
                                set(
                                    value,
                                    'period.numberOfPeriodsToGenerate',
                                    Number(v)
                                )
                            )
                        }
                    />
                </div>
            </FormSection>
        </>
    )
}
