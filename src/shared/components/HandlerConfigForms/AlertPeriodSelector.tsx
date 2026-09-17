import { Field } from '@dhis2/ui'
import { FixedPeriodSelector } from '@hisptz/dhis2-ui'
import React from 'react'
import { Controller } from 'react-hook-form'

export function AlertPeriodSelector() {
    return (
        <Controller
            name="handlerConfig.period"
            render={({ field, fieldState }) => {
                return (
                    <Field
                        validationText={fieldState.error?.message}
                        error={!!fieldState.error?.message}
                    >
                        <FixedPeriodSelector
                            allowFuturePeriods
                            selectedPeriods={field.value?.periods}
                            onSelect={(periods) => {
                                field.onChange({
                                    periods: periods?.items,
                                })
                            }}
                        />
                    </Field>
                )
            }}
        />
    )
}
