import React from 'react'
import {
    isRequired,
    isWideField,
    schemaProperties,
    type JsonSchema,
} from './jsonSchema'
import classes from './SchemaConfigForm.module.css'
import { SchemaField } from './SchemaField'

export interface SchemaObjectFieldsProps {
    name: string
    schema: JsonSchema
}

export function SchemaObjectFields({
    name,
    schema,
}: SchemaObjectFieldsProps): React.ReactElement {
    return (
        <div className={classes.fields}>
            {schemaProperties(schema).map(([key, property]) => (
                <div
                    key={key}
                    className={isWideField(property) ? classes.wide : undefined}
                >
                    <SchemaField
                        name={`${name}.${key}`}
                        fieldKey={key}
                        schema={property}
                        required={isRequired(schema, key)}
                    />
                </div>
            ))}
        </div>
    )
}
