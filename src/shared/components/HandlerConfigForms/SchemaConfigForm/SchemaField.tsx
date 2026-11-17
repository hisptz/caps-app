import React from 'react'
import {
    describeSchema,
    fieldHelp,
    fieldLabel,
    type JsonSchema,
} from './jsonSchema'
import { SchemaBooleanField } from './SchemaBooleanField'
import { SchemaJsonField } from './SchemaJsonField'
import { SchemaListField } from './SchemaListField'
import { SchemaMultiSelectField } from './SchemaMultiSelectField'
import { SchemaNumberField } from './SchemaNumberField'
import { SchemaObjectField } from './SchemaObjectField'
import { SchemaPickerField } from './SchemaPickerField'
import { SchemaSelectField } from './SchemaSelectField'
import { SchemaTextField } from './SchemaTextField'
import { SchemaVariantField } from './SchemaVariantField'

export interface SchemaFieldProps {
    name: string
    fieldKey: string
    schema: JsonSchema
    required: boolean
}

/** Draws one field of a handler's config from its JSON Schema. */
export function SchemaField({
    name,
    fieldKey,
    schema,
    required,
}: SchemaFieldProps): React.ReactElement {
    const node = describeSchema(schema)
    const label = fieldLabel(fieldKey, schema)
    const helpText = fieldHelp(schema)
    const common = { name, label, helpText, required }

    switch (node.kind) {
        case 'text':
            return <SchemaTextField {...common} multiline={node.multiline} />
        case 'select':
            return <SchemaSelectField {...common} options={node.options} />
        case 'number':
            return (
                <SchemaNumberField
                    {...common}
                    integer={node.integer}
                    min={node.min}
                    max={node.max}
                />
            )
        case 'boolean':
            return <SchemaBooleanField {...common} />
        case 'list':
            return <SchemaListField {...common} item={node.item} />
        case 'multiSelect':
            return <SchemaMultiSelectField {...common} options={node.options} />
        case 'object':
            return <SchemaObjectField {...common} schema={node.schema} />
        case 'variant':
            return <SchemaVariantField {...common} node={node} />
        case 'picker':
            return (
                <SchemaPickerField
                    {...common}
                    picker={node.picker}
                    list={node.list}
                />
            )
        case 'json':
            return <SchemaJsonField {...common} />
    }
}
