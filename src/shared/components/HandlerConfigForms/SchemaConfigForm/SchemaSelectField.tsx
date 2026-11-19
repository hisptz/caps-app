import i18n from '@dhis2/d2-i18n'
import { SingleSelectField, SingleSelectOption } from '@dhis2/ui'
import React from 'react'
import { useController } from 'react-hook-form'
import { humanizeKey } from './jsonSchema'

export interface SchemaSelectFieldProps {
    name: string
    label: string
    helpText?: string
    required: boolean
    options: string[]
}

export function SchemaSelectField({
    name,
    label,
    helpText,
    required,
    options,
}: SchemaSelectFieldProps): React.ReactElement {
    const { field, fieldState } = useController({ name })
    const selected =
        typeof field.value === 'string' && options.includes(field.value)
            ? field.value
            : ''

    return (
        <SingleSelectField
            label={label}
            helpText={helpText}
            required={required}
            placeholder={i18n.t('Choose an option')}
            clearable={!required}
            clearText={i18n.t('Clear')}
            selected={selected}
            onChange={({ selected: next }) => field.onChange(next || undefined)}
            onBlur={field.onBlur}
            error={Boolean(fieldState.error)}
            validationText={fieldState.error?.message}
        >
            {options.map((option) => (
                <SingleSelectOption
                    key={option}
                    value={option}
                    label={humanizeKey(option)}
                />
            ))}
        </SingleSelectField>
    )
}
