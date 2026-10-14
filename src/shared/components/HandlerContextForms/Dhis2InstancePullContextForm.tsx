import i18n from '@dhis2/d2-i18n'
import { NoticeBox } from '@dhis2/ui'
import React from 'react'
import { useController } from 'react-hook-form'
import type { RunContextMode } from './HandlerContextForm'
import type { PullPeriod } from '@/modules/dhis2-instance-pull/schemas/config'
import { ConfigLabeledControl } from '@/shared/components/HandlerConfigForms/ConfigLabeledControl'
import { PullPeriodFields } from '@/shared/components/HandlerConfigForms/Dhis2InstancePullConfig/PullPeriodFields'
import { schedulePullPeriod } from '@/shared/components/HandlerConfigForms/Dhis2InstancePullConfig/schedulePeriod'
import {
    FormSection,
    SegmentedControl,
} from '@/shared/components/ui/FormPrimitives'

export interface Dhis2InstancePullContextFormProps {
    stepId: string
    handlerConfig?: Record<string, unknown> | null
    mode?: RunContextMode
}

/** Where a run's periods come from: the step (no override), latest periods or a fixed range. */
type PeriodSource = 'step' | PullPeriod['mode']

const STEP_OPTION = { value: 'step', label: i18n.t('Step’s periods') } as const
const LATEST_OPTION = {
    value: 'relative',
    label: i18n.t('Latest periods'),
} as const
const FIXED_OPTION = { value: 'fixed', label: i18n.t('Fixed range') } as const

function describePullPeriod(
    period: PullPeriod | undefined
): string | undefined {
    if (period?.mode === 'relative') {
        return i18n.t(
            'Latest periods: {{count}}, skipping the most recent {{offset}}',
            { count: period.count, offset: period.offset }
        )
    }
    if (period?.mode === 'fixed' && period.start && period.end) {
        return i18n.t('Fixed range: {{start}} to {{end}}', {
            start: period.start,
            end: period.end,
        })
    }
    return undefined
}

export function Dhis2InstancePullContextForm({
    stepId,
    handlerConfig,
    mode = 'run',
}: Dhis2InstancePullContextFormProps): React.ReactElement {
    const name = `stepContexts.${stepId}`
    const { field } = useController({ name })
    const value = field.value as { period?: PullPeriod } | undefined
    const configPeriod = handlerConfig?.period as PullPeriod | undefined
    const source: PeriodSource = value?.period?.mode ?? 'step'
    const options =
        mode === 'schedule'
            ? [STEP_OPTION, LATEST_OPTION]
            : [STEP_OPTION, LATEST_OPTION, FIXED_OPTION]

    function switchSource(next: PeriodSource) {
        const rest = { ...(value ?? {}) }
        delete rest.period
        if (next === 'step') {
            field.onChange(rest)
            return
        }
        field.onChange({
            ...rest,
            period:
                next === 'relative'
                    ? schedulePullPeriod(configPeriod)
                    : {
                          mode: 'fixed',
                          periodType: configPeriod?.periodType ?? 'MONTHLY',
                          start: '',
                          end: '',
                      },
        })
    }

    const stepSummary = describePullPeriod(configPeriod)

    return (
        <FormSection
            title={i18n.t('Periods')}
            description={
                mode === 'schedule'
                    ? i18n.t(
                          'Scheduled runs pull the step’s periods, including later edits to the step, or latest periods of their own.'
                      )
                    : i18n.t(
                          'This run pulls the step’s periods unless you choose others here, e.g. a fixed range to backfill history.'
                      )
            }
            tight
        >
            <ConfigLabeledControl label={i18n.t('Periods to pull')}>
                <SegmentedControl
                    name={`pull-context-period-source-${stepId}`}
                    value={source}
                    options={options}
                    onChange={switchSource}
                    aria-label={i18n.t('Periods to pull')}
                />
            </ConfigLabeledControl>
            {source === 'step' && stepSummary && <p>{stepSummary}</p>}
            {source === 'step' &&
                mode === 'schedule' &&
                configPeriod?.mode === 'fixed' && (
                    <NoticeBox
                        warning
                        title={i18n.t(
                            'Every scheduled run pulls the same periods'
                        )}
                    >
                        {i18n.t(
                            'This step pulls a fixed range. Choose latest periods so each scheduled run moves forward.'
                        )}
                    </NoticeBox>
                )}
            {source !== 'step' && (
                <PullPeriodFields name={`${name}.period`} lockedMode={source} />
            )}
        </FormSection>
    )
}
