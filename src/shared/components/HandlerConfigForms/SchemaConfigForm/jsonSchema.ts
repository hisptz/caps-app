export type JsonSchema = Record<string, unknown>

type Primitive = 'string' | 'number' | 'integer'

export type SchemaNode =
    | { kind: 'text'; multiline: boolean }
    | { kind: 'select'; options: string[] }
    | { kind: 'number'; integer: boolean; min?: number; max?: number }
    | { kind: 'boolean' }
    | { kind: 'list'; item: Primitive }
    | { kind: 'multiSelect'; options: string[] }
    | { kind: 'object'; schema: JsonSchema }
    | { kind: 'variant'; discriminator: string; options: VariantOption[] }
    | { kind: 'picker'; picker: CapsField; list: boolean }
    | { kind: 'json' }

export type VariantOption = { value: string; schema: JsonSchema }

/**
 * Field hints the engine puts on a field (`capsField()` in caps-engine,
 * `src/shared/handlers/fields.ts`): which DHIS2 picker to draw instead of a plain input.
 */
export const CAPS_FIELD_KEY = 'x-caps-field'

const CAPS_FIELDS = [
    'dataElement',
    'orgUnits',
    'period',
    'connectedInstance',
    'userGroups',
    'climatePeriod',
    'ocsPipeline',
] as const

export type CapsField = (typeof CAPS_FIELDS)[number]

/** What each picker shows when the field is empty, so the screen and the value agree. */
const PICKER_DEFAULTS: Partial<Record<CapsField, () => unknown>> = {
    orgUnits: () => ({}),
    period: () => ({
        mode: 'relative',
        periodType: 'MONTHLY',
        count: 3,
        offset: 1,
    }),
    climatePeriod: () => ({
        mode: 'rolling',
        periodType: 'monthly',
        count: 3,
        offset: 1,
    }),
}

/** The picker the engine asked for, when this app knows it; an unknown hint is ignored. */
function pickerOf(schema: JsonSchema): SchemaNode | undefined {
    const picker = schema[CAPS_FIELD_KEY]
    if (!CAPS_FIELDS.includes(picker as CapsField)) {
        return undefined
    }
    const list = typeOf(schema) === 'array'
    // A single data element is a string; a list is an array of them. Others have one shape.
    if (picker !== 'dataElement' && picker !== 'userGroups' && list) {
        return undefined
    }
    if (picker === 'userGroups' && !list) {
        return undefined
    }
    return { kind: 'picker', picker: picker as CapsField, list }
}

/** Strings longer than this (or with no limit) get a text area. */
const SINGLE_LINE_MAX_LENGTH = 500

function isSchema(value: unknown): value is JsonSchema {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asSchemas(value: unknown): JsonSchema[] {
    return Array.isArray(value) ? value.filter(isSchema) : []
}

function typeOf(schema: JsonSchema): string | undefined {
    const type = schema.type
    if (typeof type === 'string') {
        return type
    }
    // `["string", "null"]`: the nullable form of a primitive
    if (Array.isArray(type)) {
        const nonNull = type.filter((t) => t !== 'null')
        return nonNull.length === 1 ? String(nonNull[0]) : undefined
    }
    return undefined
}

function stringOptions(schema: JsonSchema): string[] | undefined {
    const values = Array.isArray(schema.enum) ? schema.enum : undefined
    if (!values || values.length === 0) {
        return undefined
    }
    return values.every((v) => typeof v === 'string')
        ? (values as string[])
        : undefined
}

/** `.nullable()` becomes `anyOf: [X, {type: "null"}]`; the field is X, left empty when unset. */
export function unwrapNullable(schema: JsonSchema): JsonSchema {
    const members = asSchemas(schema.anyOf ?? schema.oneOf)
    if (members.length !== 2) {
        return schema
    }
    const nonNull = members.filter((m) => m.type !== 'null')
    if (nonNull.length !== 1) {
        return schema
    }
    const rest = { ...schema }
    delete rest.anyOf
    delete rest.oneOf
    return { ...nonNull[0], ...rest }
}

function constValue(schema: unknown): string | undefined {
    if (!isSchema(schema)) {
        return undefined
    }
    if (typeof schema.const === 'string') {
        return schema.const
    }
    const options = stringOptions(schema)
    return options?.length === 1 ? options[0] : undefined
}

/**
 * A `oneOf` / `anyOf` of objects that all share one property with a fixed string value
 * (a discriminated union, e.g. `period.mode` = "fixed" | "relative").
 */
function variantOf(schema: JsonSchema): SchemaNode | undefined {
    const members = asSchemas(schema.oneOf ?? schema.anyOf)
    if (members.length < 2 || members.some((m) => !isSchema(m.properties))) {
        return undefined
    }
    const keys = Object.keys(members[0].properties as JsonSchema)
    for (const key of keys) {
        const values = members.map((m) =>
            constValue((m.properties as JsonSchema)[key])
        )
        if (values.some((v) => v === undefined)) {
            continue
        }
        if (new Set(values).size !== values.length) {
            continue
        }
        return {
            kind: 'variant',
            discriminator: key,
            options: members.map((m, i) => ({
                value: values[i] as string,
                schema: m,
            })),
        }
    }
    return undefined
}

function listOf(schema: JsonSchema): SchemaNode {
    const items = isSchema(schema.items) ? unwrapNullable(schema.items) : {}
    const options = stringOptions(items)
    if (options) {
        return { kind: 'multiSelect', options }
    }
    const itemType = typeOf(items)
    if (
        itemType === 'string' ||
        itemType === 'number' ||
        itemType === 'integer'
    ) {
        return { kind: 'list', item: itemType }
    }
    return { kind: 'json' }
}

function numberBound(value: unknown, exclusive: unknown, step: number) {
    if (typeof value === 'number') {
        return value
    }
    return typeof exclusive === 'number' ? exclusive + step : undefined
}

/** Which input a field gets. Anything this cannot draw falls back to a JSON editor. */
export function describeSchema(input: JsonSchema): SchemaNode {
    const schema = unwrapNullable(input)
    const picker = pickerOf(schema)
    if (picker) {
        return picker
    }
    const variant = variantOf(schema)
    if (variant) {
        return variant
    }
    const options = stringOptions(schema)
    if (options) {
        return { kind: 'select', options }
    }
    switch (typeOf(schema)) {
        case 'string': {
            const maxLength = schema.maxLength
            return {
                kind: 'text',
                multiline:
                    typeof maxLength !== 'number' ||
                    maxLength > SINGLE_LINE_MAX_LENGTH,
            }
        }
        case 'integer':
        case 'number': {
            const integer = typeOf(schema) === 'integer'
            const step = integer ? 1 : 0
            const max = numberBound(
                schema.maximum,
                schema.exclusiveMaximum,
                -step
            )
            return {
                kind: 'number',
                integer,
                min: numberBound(schema.minimum, schema.exclusiveMinimum, step),
                // Zod writes Number.MAX_SAFE_INTEGER for int(); not a real limit
                max: max === Number.MAX_SAFE_INTEGER ? undefined : max,
            }
        }
        case 'boolean':
            return { kind: 'boolean' }
        case 'array':
            return listOf(schema)
        case 'object':
            return isSchema(schema.properties)
                ? { kind: 'object', schema }
                : { kind: 'json' }
        default:
            return { kind: 'json' }
    }
}

export function schemaProperties(schema: JsonSchema): [string, JsonSchema][] {
    const properties = schema.properties
    if (!isSchema(properties)) {
        return []
    }
    return Object.entries(properties).filter(
        (entry): entry is [string, JsonSchema] => isSchema(entry[1])
    )
}

export function isRequired(parent: JsonSchema, key: string): boolean {
    return Array.isArray(parent.required) && parent.required.includes(key)
}

/** "chunkOrgUnits" → "Chunk org units", "period_type" → "Period type" */
export function humanizeKey(key: string): string {
    const words = key
        .replace(/[_-]+/g, ' ')
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
        .trim()
        .split(/\s+/)
        .map((word) =>
            // keep acronyms ("ID", "URL") as written
            word.length > 1 && word === word.toUpperCase()
                ? word
                : word.toLowerCase()
        )
    const sentence = words.join(' ')
    return sentence.charAt(0).toUpperCase() + sentence.slice(1)
}

/** The label a plugin gave the field (`.meta({ title })`), else its key made readable. */
export function fieldLabel(key: string, schema: JsonSchema): string {
    return typeof schema.title === 'string' && schema.title.trim()
        ? schema.title
        : humanizeKey(key)
}

/** Help text from the field's `.describe()` / `.meta({ description })`. */
export function fieldHelp(schema: JsonSchema): string | undefined {
    return typeof schema.description === 'string' && schema.description.trim()
        ? schema.description
        : undefined
}

function clone<T>(value: T): T {
    return value === undefined ? value : JSON.parse(JSON.stringify(value))
}

/**
 * The starting value for a field: its declared default, else for objects the defaults of
 * their fields. An optional object with nothing to fill in stays unset, so its required
 * fields don't fail a step that leaves it out.
 */
export function schemaDefaults(input: JsonSchema, required = true): unknown {
    const schema = unwrapNullable(input)
    if ('default' in schema) {
        return clone(schema.default)
    }
    if (schema.const !== undefined) {
        return schema.const
    }
    const node = describeSchema(schema)
    if (node.kind === 'picker') {
        const pickerDefault = PICKER_DEFAULTS[node.picker]
        return required && pickerDefault ? pickerDefault() : undefined
    }
    if (node.kind === 'variant') {
        if (!required) {
            return undefined
        }
        const [first] = node.options
        return {
            ...(schemaDefaults(first.schema) as Record<string, unknown>),
            [node.discriminator]: first.value,
        }
    }
    if (node.kind !== 'object') {
        return undefined
    }
    const result: Record<string, unknown> = {}
    for (const [key, property] of schemaProperties(schema)) {
        const value = schemaDefaults(property, isRequired(schema, key))
        if (value !== undefined) {
            result[key] = value
        }
    }
    return required || Object.keys(result).length > 0 ? result : undefined
}

/** The value for a newly picked variant: its defaults, with the discriminator set. */
export function variantDefaults(
    node: Extract<SchemaNode, { kind: 'variant' }>,
    value: string
): Record<string, unknown> {
    const option =
        node.options.find((o) => o.value === value) ?? node.options[0]
    return {
        ...(schemaDefaults(option.schema) as Record<string, unknown>),
        [node.discriminator]: option.value,
    }
}

/** Fields of a variant to draw, without the discriminator (the variant picker sets it). */
export function variantFields(
    node: Extract<SchemaNode, { kind: 'variant' }>,
    value: unknown
): JsonSchema | undefined {
    const option = node.options.find((o) => o.value === value)
    if (!option) {
        return undefined
    }
    const properties = { ...(option.schema.properties as JsonSchema) }
    delete properties[node.discriminator]
    return { ...option.schema, properties }
}

export function isWideField(schema: JsonSchema): boolean {
    const node = describeSchema(schema)
    switch (node.kind) {
        case 'text':
            return node.multiline
        case 'select':
        case 'number':
            return false
        case 'picker':
            return (
                node.list ||
                !['dataElement', 'connectedInstance'].includes(node.picker)
            )
        default:
            return true
    }
}
