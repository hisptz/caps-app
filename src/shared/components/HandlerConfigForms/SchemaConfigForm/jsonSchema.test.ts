import { z } from 'zod'
import {
    describeSchema,
    fieldLabel,
    humanizeKey,
    isWideField,
    schemaDefaults,
    unwrapNullable,
    variantDefaults,
    variantFields,
    type JsonSchema,
} from './jsonSchema'
import { parseLines } from './SchemaListField'

/** As the engine sends them on GET /handlers (z.toJSONSchema, draft-2020-12) */
const predictionPoll: JsonSchema = {
    type: 'object',
    properties: {
        polling: {
            default: { intervalSeconds: 30, timeoutHours: 6 },
            type: 'object',
            properties: {
                intervalSeconds: {
                    default: 30,
                    type: 'integer',
                    minimum: 5,
                    maximum: 3600,
                },
                timeoutHours: {
                    default: 6,
                    type: 'number',
                    minimum: 0.25,
                    maximum: 72,
                },
            },
        },
    },
}

const period: JsonSchema = {
    oneOf: [
        {
            type: 'object',
            properties: {
                mode: { type: 'string', const: 'fixed' },
                periodType: { type: 'string', enum: ['WEEKLY', 'MONTHLY'] },
                start: { type: 'string', minLength: 1 },
                end: { type: 'string', minLength: 1 },
            },
            required: ['mode', 'periodType', 'start', 'end'],
        },
        {
            type: 'object',
            properties: {
                mode: { type: 'string', const: 'relative' },
                periodType: { type: 'string', enum: ['WEEKLY', 'MONTHLY'] },
                count: { type: 'integer', minimum: 1, maximum: 260 },
                offset: {
                    default: 1,
                    type: 'integer',
                    minimum: 0,
                    maximum: 9007199254740991,
                },
            },
            required: ['mode', 'periodType', 'count'],
        },
    ],
}

const dataCheck: JsonSchema = {
    type: 'object',
    properties: {
        dataElements: {
            minItems: 1,
            maxItems: 50,
            type: 'array',
            items: { type: 'string', pattern: '^[A-Za-z][A-Za-z0-9]{10}$' },
        },
        orgUnit: {
            type: 'object',
            properties: {
                ids: { type: 'array', items: { type: 'string' } },
                levels: {
                    type: 'array',
                    items: {
                        type: 'integer',
                        exclusiveMinimum: 0,
                        maximum: 9007199254740991,
                    },
                },
            },
        },
        period,
        chunkOrgUnits: {
            default: 50,
            type: 'integer',
            minimum: 1,
            maximum: 500,
        },
    },
    required: ['dataElements', 'orgUnit', 'period'],
}

const notify: JsonSchema = {
    type: 'object',
    properties: {
        recipients: {
            default: { users: [], userGroups: [] },
            type: 'object',
            properties: {
                users: {
                    default: [],
                    type: 'array',
                    items: { type: 'string' },
                },
                userGroups: {
                    default: [],
                    type: 'array',
                    items: { type: 'string' },
                },
            },
        },
        subject: {
            default: 'CAPS: {{stepName}} — run finished',
            type: 'string',
            minLength: 1,
            maxLength: 255,
        },
        message: { default: 'Run finished.', type: 'string', minLength: 1 },
        failOnError: { default: false, type: 'boolean' },
    },
}

describe('describeSchema', () => {
    it('picks an input for each primitive', () => {
        expect(describeSchema({ type: 'boolean' })).toEqual({
            kind: 'boolean',
        })
        expect(describeSchema({ type: 'string', maxLength: 255 })).toEqual({
            kind: 'text',
            multiline: false,
        })
        expect(describeSchema({ type: 'string' })).toEqual({
            kind: 'text',
            multiline: true,
        })
        expect(
            describeSchema({ type: 'string', enum: ['WEEKLY', 'MONTHLY'] })
        ).toEqual({ kind: 'select', options: ['WEEKLY', 'MONTHLY'] })
    })

    it('reads number limits, ignoring the safe-integer cap Zod writes for int()', () => {
        expect(
            describeSchema({
                type: 'integer',
                exclusiveMinimum: 0,
                maximum: 9007199254740991,
            })
        ).toEqual({ kind: 'number', integer: true, min: 1, max: undefined })
        expect(
            describeSchema({ type: 'number', minimum: 0.25, maximum: 72 })
        ).toEqual({ kind: 'number', integer: false, min: 0.25, max: 72 })
    })

    it('draws lists of primitives one per line, and lists of choices as a multi-select', () => {
        expect(
            describeSchema({ type: 'array', items: { type: 'string' } })
        ).toEqual({ kind: 'list', item: 'string' })
        expect(
            describeSchema({
                type: 'array',
                items: { type: 'string', enum: ['a', 'b'] },
            })
        ).toEqual({ kind: 'multiSelect', options: ['a', 'b'] })
    })

    it('finds the field a oneOf is told apart by', () => {
        const node = describeSchema(period)
        expect(node.kind).toBe('variant')
        expect(node.kind === 'variant' && node.discriminator).toBe('mode')
        expect(
            node.kind === 'variant' && node.options.map((o) => o.value)
        ).toEqual(['fixed', 'relative'])
    })

    it('falls back to JSON for shapes it cannot draw', () => {
        expect(
            describeSchema({
                type: 'array',
                items: { type: 'object', properties: {} },
            })
        ).toEqual({ kind: 'json' })
        expect(
            describeSchema({
                anyOf: [{ type: 'string' }, { type: 'number' }],
            })
        ).toEqual({ kind: 'json' })
        expect(describeSchema({ type: 'object' })).toEqual({ kind: 'json' })
    })

    it('treats a nullable field as the field itself', () => {
        expect(
            describeSchema({
                anyOf: [{ type: 'integer' }, { type: 'null' }],
            })
        ).toEqual({
            kind: 'number',
            integer: true,
            min: undefined,
            max: undefined,
        })
        expect(
            unwrapNullable({
                description: 'Kept',
                anyOf: [{ type: 'string' }, { type: 'null' }],
            })
        ).toEqual({ type: 'string', description: 'Kept' })
    })
})

describe('schemaDefaults', () => {
    it('uses declared defaults', () => {
        expect(schemaDefaults(predictionPoll)).toEqual({
            polling: { intervalSeconds: 30, timeoutHours: 6 },
        })
        expect(schemaDefaults(notify)).toEqual({
            recipients: { users: [], userGroups: [] },
            subject: 'CAPS: {{stepName}} — run finished',
            message: 'Run finished.',
            failOnError: false,
        })
    })

    it('starts required objects and variants, and leaves optional empty objects out', () => {
        expect(schemaDefaults(dataCheck)).toEqual({
            orgUnit: {},
            period: { mode: 'fixed' },
            chunkOrgUnits: 50,
        })
        const optional = {
            type: 'object',
            properties: {
                extra: {
                    type: 'object',
                    properties: { url: { type: 'string' } },
                    required: ['url'],
                },
            },
        }
        expect(schemaDefaults(optional)).toEqual({})
    })

    it('does not share default objects between steps', () => {
        const first = schemaDefaults(notify) as Record<string, unknown>
        const second = schemaDefaults(notify) as Record<string, unknown>
        expect(first.recipients).not.toBe(second.recipients)
    })
})

describe('variants', () => {
    const node = describeSchema(period)
    if (node.kind !== 'variant') {
        throw new Error('expected a variant')
    }

    it('starts a newly picked variant from its own defaults', () => {
        expect(variantDefaults(node, 'relative')).toEqual({
            mode: 'relative',
            offset: 1,
        })
    })

    it('draws the picked variant without the field that picks it', () => {
        expect(
            Object.keys(variantFields(node, 'relative')?.properties ?? {})
        ).toEqual(['periodType', 'count', 'offset'])
        expect(variantFields(node, undefined)).toBeUndefined()
    })
})

describe('labels', () => {
    it('makes keys readable and keeps acronyms', () => {
        expect(humanizeKey('chunkOrgUnits')).toBe('Chunk org units')
        expect(humanizeKey('period_type')).toBe('Period type')
        expect(humanizeKey('baseURL')).toBe('Base URL')
        expect(humanizeKey('WEEKLY')).toBe('WEEKLY')
    })

    it("prefers the plugin's own title", () => {
        expect(fieldLabel('url', { title: 'EWARS address' })).toBe(
            'EWARS address'
        )
        expect(fieldLabel('url', {})).toBe('Url')
    })
})

describe('field hints', () => {
    const hinted = (schema: JsonSchema, picker: string): JsonSchema => ({
        ...schema,
        'x-caps-field': picker,
    })

    it('draws the DHIS2 picker the engine asks for', () => {
        expect(
            describeSchema(hinted({ type: 'string' }, 'dataElement'))
        ).toEqual({ kind: 'picker', picker: 'dataElement', list: false })
        expect(
            describeSchema(
                hinted(
                    { type: 'array', items: { type: 'string' } },
                    'dataElement'
                )
            )
        ).toEqual({ kind: 'picker', picker: 'dataElement', list: true })
        expect(describeSchema(hinted(period, 'period'))).toEqual({
            kind: 'picker',
            picker: 'period',
            list: false,
        })
        expect(
            describeSchema(
                hinted({ type: 'object', properties: {} }, 'orgUnits')
            )
        ).toMatchObject({ picker: 'orgUnits' })
        expect(
            describeSchema(hinted({ type: 'string' }, 'connectedInstance'))
        ).toMatchObject({ picker: 'connectedInstance' })
    })

    it('finds the hint on a nullable field', () => {
        expect(
            describeSchema({
                anyOf: [
                    { type: 'string', 'x-caps-field': 'connectedInstance' },
                    { type: 'null' },
                ],
            })
        ).toMatchObject({ kind: 'picker', picker: 'connectedInstance' })
    })

    it('ignores a hint this app does not know, or one on the wrong shape', () => {
        expect(
            describeSchema(hinted({ type: 'string' }, 'ewarsIndicator'))
        ).toEqual({ kind: 'text', multiline: true })
        expect(
            describeSchema(
                hinted(
                    { type: 'array', items: { type: 'string' } },
                    'connectedInstance'
                )
            )
        ).toEqual({ kind: 'list', item: 'string' })
        expect(
            describeSchema(hinted({ type: 'string' }, 'userGroups'))
        ).toEqual({ kind: 'text', multiline: true })
    })

    it('starts a picker from the value it shows when empty', () => {
        const schema: JsonSchema = {
            type: 'object',
            properties: {
                orgUnit: hinted({ type: 'object', properties: {} }, 'orgUnits'),
                period: hinted(period, 'period'),
                optionalPeriod: hinted(period, 'period'),
                dataElements: hinted(
                    { type: 'array', items: { type: 'string' } },
                    'dataElement'
                ),
            },
            required: ['orgUnit', 'period', 'dataElements'],
        }
        expect(schemaDefaults(schema)).toEqual({
            orgUnit: {},
            period: {
                mode: 'relative',
                periodType: 'MONTHLY',
                count: 3,
                offset: 1,
            },
        })
    })

    it('still builds the step check from a schema with hints', () => {
        const check = z.fromJSONSchema({
            type: 'object',
            properties: {
                dataElements: hinted(
                    {
                        type: 'array',
                        items: { type: 'string' },
                        minItems: 1,
                    },
                    'dataElement'
                ),
            },
            required: ['dataElements'],
        } as Parameters<typeof z.fromJSONSchema>[0])
        expect(check.safeParse({ dataElements: ['abc'] }).success).toBe(true)
        expect(check.safeParse({ dataElements: [] }).success).toBe(false)
    })
})

describe('parseLines', () => {
    it('reads one item per line, keeping a line that is not a number as typed', () => {
        expect(parseLines('a\n\n b \n', 'string')).toEqual(['a', 'b'])
        expect(parseLines('1\n2.5\nx', 'number')).toEqual([1, 2.5, 'x'])
    })
})

describe('isWideField', () => {
    it('puts short inputs two to a row and gives groups and long text the row', () => {
        expect(isWideField({ type: 'string', maxLength: 100 })).toBe(false)
        expect(isWideField({ type: 'integer' })).toBe(false)
        expect(isWideField({ type: 'string', enum: ['a', 'b'] })).toBe(false)
        expect(
            isWideField({ type: 'string', 'x-caps-field': 'dataElement' })
        ).toBe(false)
        expect(isWideField({ type: 'string' })).toBe(true)
        expect(isWideField({ type: 'boolean' })).toBe(true)
        expect(
            isWideField({
                type: 'object',
                properties: { a: { type: 'string' } },
            })
        ).toBe(true)
        expect(
            isWideField({ type: 'object', 'x-caps-field': 'orgUnits' })
        ).toBe(true)
    })
})
