import i18n from '@dhis2/d2-i18n'
import { Button, InputField } from '@dhis2/ui'
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
                        render={({ field, fieldState }) => (
                            <InputField
                                label={i18n.t('Last years')}
                                type="number"
                                helpText={i18n.t(
                                    'Limit analytics generation to the most recent N years. Leave blank for default DHIS2 behavior.'
                                )}
                                value={
                                    typeof field.value === 'number' &&
                                    Number.isFinite(field.value)
                                        ? String(field.value)
                                        : ''
                                }
                                onChange={({ value: v }) => {
                                    const raw = v ?? ''
                                    if (raw === '') {
                                        field.onChange(undefined)
                                        return
                                    }
                                    const parsed = Number(raw)
                                    field.onChange(
                                        Number.isFinite(parsed)
                                            ? parsed
                                            : undefined
                                    )
                                }}
                                onBlur={field.onBlur}
                                error={Boolean(fieldState.error)}
                                validationText={fieldState.error?.message}
                            />
                        )}
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
