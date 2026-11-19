import i18n from '@dhis2/d2-i18n'
import { MultiSelectField, MultiSelectOption } from '@dhis2/ui'
import React from 'react'
import { useController } from 'react-hook-form'
import { firstErrorMessage } from './firstErrorMessage'
import { humanizeKey } from './jsonSchema'

export interface SchemaMultiSelectFieldProps {
    name: string
    label: string
    helpText?: string
    required: boolean
    options: string[]
}

export function SchemaMultiSelectField({
    name,
    label,
    helpText,
    required,
    options,
}: SchemaMultiSelectFieldProps): React.ReactElement {
    const { field, fieldState } = useController({ name })
    const selected = Array.isArray(field.value)
        ? (field.value as unknown[]).filter(
              (v): v is string => typeof v === 'string' && options.includes(v)
          )
        : []
    const message = firstErrorMessage(fieldState.error)

    return (
        <MultiSelectField
            label={label}
            helpText={helpText}
            required={required}
            placeholder={i18n.t('Choose options')}
            clearable
            clearText={i18n.t('Clear')}
            selected={selected}
            onChange={({ selected: next }: { selected: string[] }) =>
                field.onChange(next.length > 0 || required ? next : undefined)
            }
            onBlur={field.onBlur}
            error={Boolean(message)}
            validationText={message}
        >
            {options.map((option) => (
                <MultiSelectOption
                    key={option}
                    value={option}
                    label={humanizeKey(option)}
                />
            ))}
        </MultiSelectField>
    )
}
