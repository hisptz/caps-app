import { SwitchField } from '@dhis2/ui'
import React from 'react'
import { useController } from 'react-hook-form'

export interface SchemaBooleanFieldProps {
    name: string
    label: string
    helpText?: string
}

export function SchemaBooleanField({
    name,
    label,
    helpText,
}: SchemaBooleanFieldProps): React.ReactElement {
    const { field, fieldState } = useController({ name })

    return (
        <SwitchField
            name={name}
            label={label}
            helpText={helpText}
            checked={field.value === true}
            onChange={({ checked }) => field.onChange(checked)}
            onBlur={field.onBlur}
            error={Boolean(fieldState.error)}
            validationText={fieldState.error?.message}
        />
    )
}
