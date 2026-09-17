import i18n from '@dhis2/d2-i18n'
import {
    Button,
    IconCross16,
    InputField,
    SingleSelectField,
    SingleSelectOption,
} from '@dhis2/ui'
import React from 'react'
import { useController } from 'react-hook-form'
import { get, set } from '../HandlerConfigForms/configHelpers'
import { ConfigLabeledControl } from '../HandlerConfigForms/ConfigLabeledControl'
import thresholdClasses from '../HandlerConfigForms/ThresholdGenerationConfig.module.css'
import {
    OrganisationUnitContextSection,
    OrgUnitValue,
} from './OrganisationUnitContextSection'
import {
    DEFAULT_YEARS_TO_INCLUDE,
    THRESHOLD_PERIOD_TYPE_VALUES,
    thresholdPeriodTypeLabel,
} from '@/modules/threshold-generation/constants'
import {
    FormSection,
    formSectionGrids,
} from '@/shared/components/ui/FormPrimitives'

interface ThresholdContextFormProps {
    stepId: string
}

export function ThresholdContextForm({
    stepId,
}: ThresholdContextFormProps): React.ReactElement {
    const { field } = useController({
        name: `stepContexts.${stepId}`,
    })

    const value = field.value as Record<string, unknown> | null
    const onChange = field.onChange

    const periodType = (get(value, 'period.periodType') as string) || 'Monthly'
    const yearsRaw = value?.period
    const years =
        typeof yearsRaw === 'object' &&
        yearsRaw !== null &&
        Array.isArray((yearsRaw as Record<string, unknown>).years)
            ? ((yearsRaw as Record<string, unknown>).years as string[])
            : ['']

    return (
        <>
            <OrganisationUnitContextSection
                value={value?.orgUnit as OrgUnitValue}
                onChange={(value) => {
                    onChange({
                        ...value,
                        orgUnit: value,
                    })
                }}
            />
            <FormSection title={i18n.t('Period')} tight>
                <div className={formSectionGrids.grid2}>
                    <ConfigLabeledControl
                        label={i18n.t('Period type')}
                        required
                    >
                        <SingleSelectField
                            selected={periodType}
                            onChange={({ selected }) =>
                                onChange(
                                    set(value, 'period.periodType', selected)
                                )
                            }
                        >
                            {THRESHOLD_PERIOD_TYPE_VALUES.map((pt) => (
                                <SingleSelectOption
                                    key={pt}
                                    value={pt}
                                    label={thresholdPeriodTypeLabel(pt)}
                                />
                            ))}
                        </SingleSelectField>
                    </ConfigLabeledControl>
                    <InputField
                        label={i18n.t('Years to include')}
                        type="number"
                        value={get(value, 'period.yearsToInclude')}
                        onChange={({ value: v }) =>
                            onChange(
                                set(
                                    value,
                                    'period.yearsToInclude',
                                    v === ''
                                        ? DEFAULT_YEARS_TO_INCLUDE
                                        : Number(v)
                                )
                            )
                        }
                    />
                </div>
                <div className={thresholdClasses.periodYearsBlock}>
                    <div className={thresholdClasses.repeatableList}>
                        {years.map((year, index) => (
                            <div
                                key={`year-${index}`}
                                className={thresholdClasses.repeatableRow}
                            >
                                <InputField
                                    label={i18n.t('Year')}
                                    value={year}
                                    onChange={({ value: v }) => {
                                        const next = [...years]
                                        next[index] = v ?? ''
                                        onChange(
                                            set(value, 'period.years', next)
                                        )
                                    }}
                                />
                                <Button
                                    icon={<IconCross16 />}
                                    onClick={() => {
                                        const next = years.filter(
                                            (_, i) => i !== index
                                        )
                                        onChange(
                                            set(
                                                value,
                                                'period.years',
                                                next.length > 0 ? next : ['']
                                            )
                                        )
                                    }}
                                />
                            </div>
                        ))}
                        <div className={thresholdClasses.addRow}>
                            <Button
                                onClick={() =>
                                    onChange(
                                        set(value, 'period.years', [
                                            ...years,
                                            '',
                                        ])
                                    )
                                }
                            >
                                {i18n.t('Add year')}
                            </Button>
                        </div>
                    </div>
                </div>
            </FormSection>
        </>
    )
}
