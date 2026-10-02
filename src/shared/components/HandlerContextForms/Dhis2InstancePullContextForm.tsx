import i18n from '@dhis2/d2-i18n'
import { Checkbox } from '@dhis2/ui'
import React, { useState } from 'react'
import { useController } from 'react-hook-form'
import type { RunContextMode } from './HandlerContextForm'
import type { PullPeriod } from '@/modules/dhis2-instance-pull/schemas/config'
import { PullPeriodFields } from '@/shared/components/HandlerConfigForms/Dhis2InstancePullConfig/PullPeriodFields'
import { FormSection } from '@/shared/components/ui/FormPrimitives'

export interface Dhis2InstancePullContextFormProps {
    stepId: string
    handlerConfig?: Record<string, unknown> | null
    mode?: RunContextMode
}

/**
 * A run may pull a fixed range instead of the step's periods, e.g. a first backfill. Unchecked,
 * the context carries no period, so the step's own period is used, including any later edits.
 */
export function Dhis2InstancePullContextForm({
    stepId,
    handlerConfig,
    mode = 'run',
}: Dhis2InstancePullContextFormProps): React.ReactElement {
    const { field } = useController({ name: `stepContexts.${stepId}` })
    const configPeriod = handlerConfig?.period as PullPeriod | undefined
    const [checked, setChecked] = useState(() =>
        Boolean((field.value as { period?: PullPeriod } | undefined)?.period)
    )

    function toggle(next: boolean) {
        setChecked(next)
        field.onChange(
            next
                ? {
                      period: {
                          mode: 'fixed',
                          periodType: configPeriod?.periodType ?? 'MONTHLY',
                          start: '',
                          end: '',
                      },
                  }
                : {}
        )
    }

    return (
        <FormSection
            title={i18n.t('Periods')}
            description={
                mode === 'schedule'
                    ? i18n.t(
                          'Scheduled runs normally pull the step’s latest periods. A fixed range here is pulled on every scheduled run.'
                      )
                    : i18n.t(
                          'Pull a fixed range for this run only, e.g. to backfill history.'
                      )
            }
            tight
        >
            <Checkbox
                label={i18n.t(
                    'Pull a fixed range instead of the step’s periods'
                )}
                checked={checked}
                onChange={(e) => toggle(e.checked)}
            />
            {checked && (
                <PullPeriodFields
                    name={`stepContexts.${stepId}.period`}
                    allowRelative={false}
                />
            )}
        </FormSection>
    )
}
