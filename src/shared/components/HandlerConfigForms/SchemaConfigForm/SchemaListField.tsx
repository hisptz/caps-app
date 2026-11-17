import i18n from '@dhis2/d2-i18n'
import { TextAreaField } from '@dhis2/ui'
import React, { useState } from 'react'
import { useController } from 'react-hook-form'
import { firstErrorMessage } from './firstErrorMessage'

export interface SchemaListFieldProps {
    name: string
    label: string
    helpText?: string
    required: boolean
    item: 'string' | 'number' | 'integer'
}

function toText(value: unknown): string {
    return Array.isArray(value) ? value.map(String).join('\n') : ''
}

/** One item per line. A line that isn't a number is kept as typed, so the check names it. */
export function parseLines(
    text: string,
    item: SchemaListFieldProps['item']
): unknown[] {
    return text
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
            if (item === 'string') {
                return line
            }
            const parsed = Number(line)
            return Number.isFinite(parsed) ? parsed : line
        })
}

export function SchemaListField({
    name,
    label,
    helpText,
    required,
    item,
}: SchemaListFieldProps): React.ReactElement {
    const { field, fieldState } = useController({ name })
    // The text is kept as typed: rebuilding it from the list would drop a new empty line.
    const [text, setText] = useState(() => toText(field.value))
    const message = firstErrorMessage(fieldState.error)
    const hint = i18n.t('One per line.')

    return (
        <TextAreaField
            name={name}
            label={label}
            helpText={helpText ? `${helpText} ${hint}` : hint}
            required={required}
            rows={3}
            autoGrow
            value={text}
            onChange={({ value: next }) => {
                const raw = next ?? ''
                setText(raw)
                const items = parseLines(raw, item)
                field.onChange(items.length > 0 || required ? items : undefined)
            }}
            onBlur={field.onBlur}
            error={Boolean(message)}
            validationText={message}
        />
    )
}
