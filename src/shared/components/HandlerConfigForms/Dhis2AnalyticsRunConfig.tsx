import i18n from '@dhis2/d2-i18n'
import { Button, SingleSelectField, SingleSelectOption } from '@dhis2/ui'
import React, { useEffect, useMemo, useState } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { AdvancedRunOptionsFields } from './AdvancedRunOptionsFields'
import { PollingFields } from './PollingFields'
import {
    defaultDhis2AnalyticsRunConfig,
    isDhis2AnalyticsRunConfig,
} from '@/modules/dhis2-analytics-run/schemas/config'
import type { PipelineStepFormWithHandlerValues } from '@/modules/pipeline-detail/schemas/stepFormSchema'
import {
    FormSection,
    formSectionGrids,
} from '@/shared/components/ui/FormPrimitives'

const ALL_YEARS = 'all'
const MAX_LAST_YEARS = 10

function lastYearsOptions(
    selected: string
): Array<{ value: string; label: string }> {
    const options = [
        { value: ALL_YEARS, label: i18n.t('All') },
        ...Array.from({ length: MAX_LAST_YEARS + 1 }, (_, n) => ({
            value: String(n),
            label: String(n),
        })),
    ]
    if (!options.some((option) => option.value === selected)) {
        options.push({ value: selected, label: selected })
    }
    return options
}

export interface Dhis2AnalyticsRunConfigProps {
    value: Record<string, unknown> | null
    onChange: (v: Record<string, unknown>) => void
}

export function Dhis2AnalyticsRunConfig({
    value,
    onChange,
}: Dhis2AnalyticsRunConfigProps): React.ReactElement {
    const { control, getValues, setValue } =
        useFormContext<PipelineStepFormWithHandlerValues>()
    const [showAdvanced, setShowAdvanced] = useState(false)

    const defaults = useMemo(() => defaultDhis2AnalyticsRunConfig(), [])

    useEffect(() => {
        const raw = getValues('handlerConfig') ?? value
        if (!isDhis2AnalyticsRunConfig(raw)) {
            setValue('handlerConfig', defaults, { shouldDirty: false })
            onChange(defaults)
        }
    }, [defaults, getValues, onChange, setValue, value])

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <FormSection
                title={i18n.t('Run options')}
                description={i18n.t(
                    'These options are passed as query parameters to DHIS2 analytics table generation.'
                )}
                tight
            >
                <div className={formSectionGrids.grid2}>
                    <Controller
                        name="handlerConfig.runOptions.lastYears"
                        control={control}
                        render={({ field, fieldState }) => {
                            const selected =
                                typeof field.value === 'number'
                                    ? String(field.value)
                                    : ALL_YEARS
                            return (
                                <SingleSelectField
                                    label={i18n.t('Last years')}
                                    selected={selected}
                                    onChange={({ selected: next }) =>
                                        field.onChange(
                                            next === ALL_YEARS
                                                ? undefined
                                                : Number(next)
                                        )
                                    }
                                    helpText={i18n.t(
                                        'All rebuilds every year. A number rebuilds only that many recent years; 0 updates only data changed since the last run.'
                                    )}
                                    error={Boolean(fieldState.error)}
                                    validationText={fieldState.error?.message}
                                >
                                    {lastYearsOptions(selected).map(
                                        (option) => (
                                            <SingleSelectOption
                                                key={option.value}
                                                value={option.value}
                                                label={option.label}
                                            />
                                        )
                                    )}
                                </SingleSelectField>
                            )
                        }}
                    />
                </div>

                <div style={{ marginTop: 8 }}>
                    <Button
                        small
                        secondary
                        type="button"
                        onClick={() => setShowAdvanced((v) => !v)}
                        aria-expanded={showAdvanced}
                    >
                        {showAdvanced
                            ? i18n.t('Hide advanced options')
                            : i18n.t('Show advanced options')}
                    </Button>
                </div>

                {showAdvanced && <AdvancedRunOptionsFields />}
            </FormSection>

            <FormSection
                title={i18n.t('Polling')}
                description={i18n.t(
                    'Controls how CAPS waits for DHIS2 task completion.'
                )}
                tight
            >
                <PollingFields />
            </FormSection>
        </div>
    )
}
