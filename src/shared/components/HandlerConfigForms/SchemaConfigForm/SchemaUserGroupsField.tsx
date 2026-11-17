import React from 'react'
import { useController } from 'react-hook-form'
import { firstErrorMessage } from './firstErrorMessage'
import { UserGroupSelector } from '@/shared/components/UserGroupSelector/UserGroupSelector'

export interface SchemaUserGroupsFieldProps {
    name: string
    label: string
    helpText?: string
    required: boolean
}

export function SchemaUserGroupsField({
    name,
    label,
    helpText,
    required,
}: SchemaUserGroupsFieldProps): React.ReactElement {
    const { field, fieldState } = useController({ name })
    const selected = Array.isArray(field.value)
        ? (field.value as unknown[]).filter(
              (v): v is string => typeof v === 'string'
          )
        : []

    return (
        <UserGroupSelector
            label={label}
            helpText={helpText}
            required={required}
            selected={selected}
            onChange={field.onChange}
            validationText={firstErrorMessage(fieldState.error)}
        />
    )
}
