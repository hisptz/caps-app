import i18n from '@dhis2/d2-i18n'
import { Button, IconAdd16, IconCross16, NoticeBox } from '@dhis2/ui'
import React, { useEffect } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { DataElementSelector } from './DataElementSelector'
import { PullPeriodFields } from './Dhis2InstancePullConfig/PullPeriodFields'
import { OrganisationUnitConfigSection } from './OrganisationUnitConfigSection'
import type { PipelineStepFormWithHandlerValues } from '@/modules/pipeline-detail/schemas/stepFormSchema'
import { FormSection } from '@/shared/components/ui/FormPrimitives'

export interface Dhis2DataCheckConfigProps {
    value: Record<string, unknown> | null
    onChange: (v: Record<string, unknown>) => void
}

/** Defaults: one data element to choose, the last full month. */
export function defaultDhis2DataCheckConfig(): Record<string, unknown> {
    return {
        dataElements: [''],
        orgUnit: { levels: [] },
        period: {
            mode: 'relative',
            periodType: 'MONTHLY',
            count: 1,
            offset: 1,
        },
        chunkOrgUnits: 50,
    }
}

function isDataCheckShape(value: unknown): boolean {
    return (
        typeof value === 'object' &&
        value !== null &&
        Array.isArray((value as { dataElements?: unknown }).dataElements) &&
        typeof (value as { period?: unknown }).period === 'object'
    )
}

/**
 * Settings for the DHIS2 data check step: which data elements, org units and periods to look
 * for. The step reports values found, values expected and completeness, which a connector can
 * check (e.g. "Completeness is at least 80").
 */
export function Dhis2DataCheckConfig({
    value,
    onChange,
}: Dhis2DataCheckConfigProps): React.ReactElement {
    const { control, getValues, setValue } =
        useFormContext<PipelineStepFormWithHandlerValues>()

    useEffect(() => {
        const raw = getValues('handlerConfig') ?? value
        if (!isDataCheckShape(raw)) {
            const defaults = defaultDhis2DataCheckConfig()
            setValue('handlerConfig', defaults, { shouldDirty: false })
            onChange(defaults)
        }
    }, [getValues, onChange, setValue, value])

    const dataElements =
        (useWatch({ control, name: 'handlerConfig.dataElements' }) as
            | string[]
            | undefined) ?? []

    const setDataElements = (next: string[]) =>
        setValue('handlerConfig.dataElements', next, {
            shouldDirty: true,
            shouldValidate: false,
        })

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <FormSection
                title={i18n.t('What to look for')}
                description={i18n.t(
                    'The data elements to check. A value for any category option counts.'
                )}
                tight
            >
                {dataElements.map((_, index) => (
                    <div
                        key={index}
                        style={{
                            display: 'flex',
                            alignItems: 'flex-end',
                            gap: 8,
                        }}
                    >
                        <div style={{ flex: 1 }}>
                            <DataElementSelector
                                name={`handlerConfig.dataElements.${index}`}
                                label={
                                    index === 0
                                        ? i18n.t('Data element')
                                        : i18n.t('Data element {{number}}', {
                                              number: index + 1,
                                          })
                                }
                            />
                        </div>
                        {dataElements.length > 1 && (
                            <Button
                                small
                                secondary
                                type="button"
                                icon={<IconCross16 />}
                                aria-label={i18n.t('Remove data element')}
                                onClick={() =>
                                    setDataElements(
                                        dataElements.filter(
                                            (__, i) => i !== index
                                        )
                                    )
                                }
                            />
                        )}
                    </div>
                ))}
                <div>
                    <Button
                        small
                        type="button"
                        icon={<IconAdd16 />}
                        onClick={() => setDataElements([...dataElements, ''])}
                    >
                        {i18n.t('Add data element')}
                    </Button>
                </div>
            </FormSection>

            <FormSection
                title={i18n.t('Where')}
                description={i18n.t('The org units that should have data.')}
                tight
            >
                <OrganisationUnitConfigSection />
            </FormSection>

            <FormSection
                title={i18n.t('Which periods')}
                description={i18n.t(
                    'Usually the last full month, so each run checks the month that just ended.'
                )}
                tight
            >
                <PullPeriodFields name="handlerConfig.period" />
            </FormSection>

            <NoticeBox title={i18n.t('What it reports')}>
                {i18n.t(
                    'Values found, values expected (data elements × org units × periods) and completeness (%). It reads the data as entered, not analytics, and finding nothing is a normal result: the step succeeds and reports 0. Use a connector to act on it, e.g. “Completeness is at least 80”.',
                    { nsSeparator: '~~' }
                )}
            </NoticeBox>
        </div>
    )
}
