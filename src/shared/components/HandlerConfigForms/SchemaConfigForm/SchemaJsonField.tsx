import i18n from '@dhis2/d2-i18n'
import { TextAreaField } from '@dhis2/ui'
import React, { useState } from 'react'
import { useController } from 'react-hook-form'
import { firstErrorMessage } from './firstErrorMessage'

export interface SchemaJsonFieldProps {
    name: string
    label: string
    helpText?: string
    required: boolean
}

function toText(value: unknown): string {
    return value === undefined ? '' : JSON.stringify(value, null, 2)
}

/** For a field shape the form can't draw (e.g. a list of objects): the value as JSON. */
export function SchemaJsonField({
    name,
    label,
    helpText,
    required,
}: SchemaJsonFieldProps): React.ReactElement {
    const { field, fieldState } = useController({ name })
    const [text, setText] = useState(() => toText(field.value))
    const [parseError, setParseError] = useState<string | null>(null)
    const message = parseError ?? firstErrorMessage(fieldState.error)
    const hint = i18n.t('Enter the value as JSON.')

    return (
        <TextAreaField
            name={name}
            label={label}
            helpText={helpText ? `${helpText} ${hint}` : hint}
            required={required}
            rows={4}
            autoGrow
            value={text}
            onChange={({ value: next }) => {
                const raw = next ?? ''
                setText(raw)
                if (raw.trim() === '') {
                    setParseError(null)
                    field.onChange(undefined)
                    return
                }
                try {
                    field.onChange(JSON.parse(raw))
                    setParseError(null)
                } catch {
                    setParseError(i18n.t('This is not valid JSON yet.'))
                }
            }}
            onBlur={field.onBlur}
            error={Boolean(message)}
            validationText={message ?? undefined}
        />
    )
}
