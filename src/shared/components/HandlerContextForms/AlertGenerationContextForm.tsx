import i18n from '@dhis2/d2-i18n'
import { Button, IconCross16, InputField } from '@dhis2/ui'
import React from 'react'
import { useController } from 'react-hook-form'
import { set } from '../HandlerConfigForms/configHelpers'
import { ConfigLabeledControl } from '../HandlerConfigForms/ConfigLabeledControl'
import thresholdClasses from '../HandlerConfigForms/ThresholdGenerationConfig.module.css'
import {
    OrganisationUnitContextSection,
    OrgUnitValue,
} from './OrganisationUnitContextSection'
import { alertPeriodHelpText } from '@/modules/alert-generation/constants'
import { FormSection } from '@/shared/components/ui/FormPrimitives'

export interface AlertGenerationContextFormProps {
    stepId: string
}

function getPeriods(value: Record<string, unknown> | null): string[] {
    const periodRaw = value?.period
    if (
        typeof periodRaw === 'object' &&
        periodRaw !== null &&
        Array.isArray((periodRaw as Record<string, unknown>).periods)
    ) {
        const periods = (periodRaw as Record<string, unknown>)
            .periods as string[]
        return periods.length > 0 ? periods : ['']
    }
    return ['']
}

export function AlertGenerationContextForm({
    stepId,
}: AlertGenerationContextFormProps): React.ReactElement {
    const { field } = useController({
        name: `stepContexts.${stepId}`,
    })
    const value = field.value as Record<string, unknown> | null
    const onChange = field.onChange
    const periods = getPeriods(value)

    return (
        <>
            <OrganisationUnitContextSection
                value={value?.orgUnit as unknown as OrgUnitValue}
                onChange={(value) => {
                    onChange({
                        ...value,
                        orgUnit: value,
                    })
                }}
            />
            <FormSection
                title={i18n.t('Periods')}
                description={i18n.t('Override reporting periods for this run')}
                tight
            >
                <ConfigLabeledControl
                    label={i18n.t('Period IDs')}
                    helpText={alertPeriodHelpText()}
                    required
                >
                    <div className={thresholdClasses.repeatableList}>
                        {periods.map((periodId, index) => (
                            <div
                                key={`period-${index}`}
                                className={thresholdClasses.repeatableRow}
                            >
                                <InputField
                                    label={
                                        index === 0
                                            ? i18n.t('Period ID')
                                            : undefined
                                    }
                                    value={periodId}
                                    onChange={({ value: v }) => {
                                        const next = [...periods]
                                        next[index] = v ?? ''
                                        onChange(
                                            set(value, 'period.periods', next)
                                        )
                                    }}
                                />
                                <Button
                                    icon={<IconCross16 />}
                                    onClick={() => {
                                        const next = periods.filter(
                                            (_, i) => i !== index
                                        )
                                        onChange(
                                            set(
                                                value,
                                                'period.periods',
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
                                        set(value, 'period.periods', [
                                            ...periods,
                                            '',
                                        ])
                                    )
                                }
                            >
                                {i18n.t('Add period')}
                            </Button>
                        </div>
                    </div>
                </ConfigLabeledControl>
            </FormSection>
        </>
    )
}
