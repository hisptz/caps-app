import { InputField, TextAreaField } from '@dhis2/ui'
import React from 'react'
import { useController } from 'react-hook-form'

export interface SchemaTextFieldProps {
    name: string
    label: string
    helpText?: string
    required: boolean
    multiline: boolean
}

export function SchemaTextField({
    name,
    label,
    helpText,
    required,
    multiline,
}: SchemaTextFieldProps): React.ReactElement {
    const { field, fieldState } = useController({ name })
    const value = typeof field.value === 'string' ? field.value : ''
    const onChange = ({ value: next }: { value?: string }) =>
        field.onChange(next ? next : undefined)
    const shared = {
        name,
        label,
        helpText,
        required,
        value,
        onChange,
        onBlur: field.onBlur,
        error: Boolean(fieldState.error),
        validationText: fieldState.error?.message,
    }

    return multiline ? (
        <TextAreaField {...shared} rows={4} autoGrow />
    ) : (
        <InputField {...shared} />
    )
}
