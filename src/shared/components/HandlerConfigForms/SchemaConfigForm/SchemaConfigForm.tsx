import React from 'react'
import type { JsonSchema } from './jsonSchema'
import { SchemaDefaults } from './SchemaDefaults'
import { SchemaObjectFields } from './SchemaObjectFields'

export interface SchemaConfigFormProps {
    name: string
    schema: JsonSchema
    onChange?: (value: Record<string, unknown>) => void
}

/**
 * A config form drawn from a handler's JSON Schema, for handlers without a hand-built form.
 * Checks are not done here: the step form already checks the config against the same schema
 * and puts each message on its field.
 */
export function SchemaConfigForm({
    name,
    schema,
    onChange,
}: SchemaConfigFormProps): React.ReactElement {
    return (
        <>
            <SchemaDefaults name={name} schema={schema} onChange={onChange} />
            <SchemaObjectFields name={name} schema={schema} />
        </>
    )
}
