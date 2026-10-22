import i18n from '@dhis2/d2-i18n'
import { NoticeBox } from '@dhis2/ui'
import React from 'react'
import { useController } from 'react-hook-form'
import type { RunContextMode } from './HandlerContextForm'
import type { PushPeriod } from '@/modules/dhis2-instance-push/schemas/config'
import { describePushPeriod } from '@/modules/dhis2-instance-push/utils/schedulePeriod'
import { ConfigLabeledControl } from '@/shared/components/HandlerConfigForms/ConfigLabeledControl'
import { PullPeriodFields } from '@/shared/components/HandlerConfigForms/Dhis2InstancePullConfig/PullPeriodFields'
import { PushPeriodFields } from '@/shared/components/HandlerConfigForms/Dhis2InstancePushConfig/PushPeriodFields'
import {
    FormSection,
    SegmentedControl,
} from '@/shared/components/ui/FormPrimitives'

export interface Dhis2InstancePushContextFormProps {
    stepId: string
    handlerConfig?: Record<string, unknown> | null
    mode?: RunContextMode
}

type PushContext = { period?: PushPeriod }

/** Where a run's values come from: the step (no override) or a period of its own. */
type PeriodSource = 'step' | 'own' | 'fixed'

export function Dhis2InstancePushContextForm({
    stepId,
    handlerConfig,
    mode = 'run',
}: Dhis2InstancePushContextFormProps): React.ReactElement {
    const name = `stepContexts.${stepId}`
    const { field } = useController({ name })
    const value = (field.value ?? {}) as PushContext
    const configPeriod = handlerConfig?.period as PushPeriod | undefined
    const readsAnalytics = handlerConfig?.source === 'analytics'
    const periodSource: PeriodSource = !value.period
        ? 'step'
        : value.period.mode === 'fixed'
          ? 'fixed'
          : 'own'

    function update(next: PushContext) {
        const clean = { ...next }
        if (clean.period === undefined) {
            delete clean.period
        }
        field.onChange(clean)
    }

    function switchPeriod(next: PeriodSource) {
        const periodType =
            configPeriod && configPeriod.mode !== 'updated'
                ? configPeriod.periodType
                : 'MONTHLY'
        update({
            ...value,
            period:
                next === 'step'
                    ? undefined
                    : next === 'fixed'
                      ? { mode: 'fixed', periodType, start: '', end: '' }
                      : configPeriod && configPeriod.mode !== 'fixed'
                        ? configPeriod
                        : readsAnalytics
                          ? {
                                mode: 'relative',
                                periodType,
                                count: 3,
                                offset: 1,
                            }
                          : { mode: 'updated', days: 7 },
        })
    }

    // Schedules don't take a fixed range: every run would push the same periods.
    const periodOptions: Array<{ value: PeriodSource; label: string }> =
        mode === 'schedule'
            ? [
                  { value: 'step', label: i18n.t('Step’s setting') },
                  { value: 'own', label: i18n.t('Choose for this schedule') },
              ]
            : [
                  { value: 'step', label: i18n.t('Step’s setting') },
                  { value: 'own', label: i18n.t('Choose for this run') },
                  { value: 'fixed', label: i18n.t('Fixed range') },
              ]
    const stepSummary = describePushPeriod(configPeriod)

    return (
        <FormSection
            title={i18n.t('Values to push')}
            description={
                mode === 'schedule'
                    ? i18n.t(
                          'Scheduled runs push what the step is set to, including later edits to the step, unless you choose otherwise here.'
                      )
                    : i18n.t(
                          'This run pushes what the step is set to unless you choose otherwise here, e.g. a fixed range to backfill history.'
                      )
            }
            tight
        >
            <ConfigLabeledControl label={i18n.t('Values to push')}>
                <SegmentedControl<PeriodSource>
                    name={`push-context-period-source-${stepId}`}
                    value={periodSource}
                    options={periodOptions}
                    onChange={switchPeriod}
                    aria-label={i18n.t('Values to push')}
                />
            </ConfigLabeledControl>
            {periodSource === 'step' && stepSummary && <p>{stepSummary}</p>}
            {periodSource === 'step' &&
                mode === 'schedule' &&
                configPeriod?.mode === 'fixed' && (
                    <NoticeBox
                        warning
                        title={i18n.t(
                            'Every scheduled run pushes the same periods'
                        )}
                    >
                        {i18n.t(
                            'This step pushes a fixed range. Choose recently updated values or latest periods for this schedule so each run moves forward.'
                        )}
                    </NoticeBox>
                )}
            {periodSource === 'own' && (
                <PushPeriodFields
                    name={`${name}.period`}
                    allowFixed={false}
                    allowUpdated={!readsAnalytics}
                />
            )}
            {periodSource === 'fixed' && (
                <PullPeriodFields name={`${name}.period`} lockedMode="fixed" />
            )}
        </FormSection>
    )
}
