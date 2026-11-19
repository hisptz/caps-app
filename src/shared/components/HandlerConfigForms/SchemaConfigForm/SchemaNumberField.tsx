import { InputField } from '@dhis2/ui'
import React from 'react'
import { useController } from 'react-hook-form'

export interface SchemaNumberFieldProps {
    name: string
    label: string
    helpText?: string
    required: boolean
    integer: boolean
    min?: number
    max?: number
}

export function SchemaNumberField({
    name,
    label,
    helpText,
    required,
    integer,
    min,
    max,
}: SchemaNumberFieldProps): React.ReactElement {
    const { field, fieldState } = useController({ name })
    const value =
        typeof field.value === 'number' && Number.isFinite(field.value)
            ? String(field.value)
            : ''

    return (
        <InputField
            name={name}
            label={label}
            helpText={helpText}
            required={required}
            type="number"
            min={min === undefined ? undefined : String(min)}
            max={max === undefined ? undefined : String(max)}
            step={integer ? '1' : 'any'}
            value={value}
            onChange={({ value: next }) => {
                const raw = next ?? ''
                const parsed = Number(raw)
                field.onChange(
                    raw === '' || !Number.isFinite(parsed) ? undefined : parsed
                )
            }}
            onBlur={field.onBlur}
            error={Boolean(fieldState.error)}
            validationText={fieldState.error?.message}
        />
    )
}
