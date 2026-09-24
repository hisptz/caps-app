import i18n from '@dhis2/d2-i18n'
import { InputField, TextAreaField } from '@dhis2/ui'
import React from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { CronPanel } from './CronPanel'
import type { HandlerDescriptor } from '@/capsApi/types'
import { PipelineRunContextSection } from '@/modules/pipeline-detail/components/PipelineRunContextSection'
import type { ScheduleFormValues } from '@/modules/pipeline-detail/schemas/scheduleFormSchema'
import { FormSection } from '@/shared/components/ui/FormPrimitives'
import type { PipelineStep } from '@/shared/types/caps'

type Props = {
    steps: PipelineStep[]
    handlers: HandlerDescriptor[]
    handlersLoading?: boolean
}

export function ScheduleModalFormBody({
    steps,
    handlers,
    handlersLoading = false,
}: Props): React.ReactElement {
    const { control } = useFormContext<ScheduleFormValues>()

    return (
        <>
            <FormSection num={1} title={i18n.t('Identification')}>
                <Controller
                    name="name"
                    control={control}
                    render={({ field, fieldState }) => (
                        <InputField
                            label={i18n.t('Name')}
                            required
                            placeholder={i18n.t('e.g. Daily 2AM')}
                            value={field.value}
                            onChange={({ value }) =>
                                field.onChange(value ?? '')
                            }
                            onBlur={field.onBlur}
                            error={Boolean(fieldState.error)}
                            validationText={fieldState.error?.message}
                        />
                    )}
                />
                <Controller
                    name="description"
                    control={control}
                    render={({ field, fieldState }) => (
                        <TextAreaField
                            label={i18n.t('Description')}
                            value={field.value ?? ''}
                            onChange={({ value }) =>
                                field.onChange(value ?? '')
                            }
                            rows={2}
                            error={Boolean(fieldState.error)}
                            validationText={fieldState.error?.message}
                        />
                    )}
                />
            </FormSection>

            <FormSection
                num={2}
                title={i18n.t('Trigger')}
                description={i18n.t('When this schedule fires the pipeline')}
            >
                <CronPanel />
            </FormSection>

            <PipelineRunContextSection
                steps={steps}
                handlers={handlers}
                handlersLoading={handlersLoading}
                mode="schedule"
            />
        </>
    )
}
