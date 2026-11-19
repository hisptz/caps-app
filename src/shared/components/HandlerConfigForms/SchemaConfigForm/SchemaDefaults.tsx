import { useEffect } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { schemaDefaults, type JsonSchema } from './jsonSchema'

export interface SchemaDefaultsProps {
    name: string
    schema: JsonSchema
    onChange?: (value: Record<string, unknown>) => void
}

export function SchemaDefaults({
    name,
    schema,
    onChange,
}: SchemaDefaultsProps): null {
    const { setValue } = useFormContext()
    const value = useWatch({ name })

    useEffect(() => {
        if (value !== null && value !== undefined) {
            return
        }
        const defaults = schemaDefaults(schema) as Record<string, unknown>
        setValue(name, defaults, { shouldDirty: false })
        onChange?.(defaults)
    }, [name, onChange, schema, setValue, value])

    return null
}
