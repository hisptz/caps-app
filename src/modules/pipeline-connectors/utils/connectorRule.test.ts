import {
    buildRule,
    describeRule,
    parseRule,
    type RuleConditionRow,
} from './connectorRule'

const IMPORTED = 'stepOutputs.s0.imported'
const ALERTS = 'stepOutputs.s1.count'

describe('buildRule', () => {
    it('returns null (always) for no rows', () => {
        expect(buildRule('all', [])).toBeNull()
    })

    it('compares a count with a number', () => {
        expect(
            buildRule('all', [{ path: IMPORTED, operator: 'gt', value: ' 0 ' }])
        ).toEqual({ '>': [{ var: `context.${IMPORTED}` }, 0] })
    })

    it('joins several rows with and / or', () => {
        const rows: RuleConditionRow[] = [
            { path: IMPORTED, operator: 'gte', value: '1' },
            { path: ALERTS, operator: 'lt', value: '5' },
        ]
        expect(buildRule('all', rows)).toEqual({
            and: [
                { '>=': [{ var: `context.${IMPORTED}` }, 1] },
                { '<': [{ var: `context.${ALERTS}` }, 5] },
            ],
        })
        expect(buildRule('any', rows)).toHaveProperty('or')
    })
})

describe('parseRule', () => {
    const roundTrips: Array<[string, RuleConditionRow[]]> = [
        ['more than', [{ path: IMPORTED, operator: 'gt', value: '0' }]],
        ['at least', [{ path: IMPORTED, operator: 'gte', value: '2' }]],
        ['less than', [{ path: IMPORTED, operator: 'lt', value: '10' }]],
        ['equals', [{ path: IMPORTED, operator: 'eq', value: '3' }]],
        [
            'several rows',
            [
                { path: IMPORTED, operator: 'gt', value: '0' },
                { path: ALERTS, operator: 'eq', value: '0' },
            ],
        ],
    ]

    it.each(roundTrips)('round-trips %s', (_label, rows) => {
        expect(parseRule(buildRule('any', rows))).toEqual({
            match: rows.length > 1 ? 'any' : 'all',
            rows,
        })
    })

    it('treats no rule as no rows', () => {
        expect(parseRule(null)).toEqual({ match: 'all', rows: [] })
    })

    it('leaves rules outside the core to be kept as they are', () => {
        // Reads status, not a step result
        expect(parseRule({ '==': [{ var: 'status' }, 'FAILED'] })).toBeNull()
        // Text comparison
        expect(
            parseRule({ '==': [{ var: 'context.a.status' }, 'OK'] })
        ).toBeNull()
        // Checks the form does not offer
        expect(parseRule({ '!=': [{ var: 'context.a' }, 1] })).toBeNull()
        expect(parseRule({ '<=': [{ var: 'context.a' }, 1] })).toBeNull()
        expect(parseRule({ '!!': [{ var: 'context.a.list' }] })).toBeNull()
        expect(
            parseRule({ in: ['202611', { var: 'context.a.periods' }] })
        ).toBeNull()
        // Nested groups
        expect(
            parseRule({ and: [{ or: [{ '>': [{ var: 'context.a' }, 0] }] }] })
        ).toBeNull()
    })
})

describe('describeRule', () => {
    it('summarises rules for tables', () => {
        expect(describeRule(null)).toBe('Always')
        expect(
            describeRule(
                { '>': [{ var: `context.${IMPORTED}` }, 0] },
                () => 'Upload → Values imported'
            )
        ).toBe('Upload → Values imported is more than 0')
        expect(
            describeRule({
                or: [
                    { '>': [{ var: `context.${IMPORTED}` }, 0] },
                    { '==': [{ var: `context.${ALERTS}` }, 0] },
                ],
            })
        ).toBe(`${IMPORTED} is more than 0 or ${ALERTS} equals 0`)
        expect(describeRule({ '==': [{ var: 'status' }, 'FAILED'] })).toBe(
            'Custom rule (set outside the app)'
        )
    })
})
