import i18n from '@dhis2/d2-i18n'

/**
 * Converts between the connector form's condition rows and the JSONLogic rule the engine stores.
 * Rows read a step result from the source execution's context, so a row path
 * `stepOutputs.<stepId>.count` becomes `{ "var": "context.stepOutputs.<stepId>.count" }`.
 *
 * The form deliberately offers a small core: compare a step's count with a number. Any other
 * rule (set through the API) parses to null and the form keeps it as is.
 */

export type RuleOperator = 'gt' | 'gte' | 'lt' | 'eq'

export type RuleMatch = 'all' | 'any'

export type RuleConditionRow = {
    path: string
    operator: RuleOperator
    /** A number as typed in the form */
    value: string
}

/** Comparisons for counts */
export const RULE_OPERATORS: ReadonlyArray<{
    value: RuleOperator
    label: () => string
}> = [
    { value: 'gt', label: () => i18n.t('is more than') },
    { value: 'gte', label: () => i18n.t('is at least') },
    { value: 'lt', label: () => i18n.t('is less than') },
    { value: 'eq', label: () => i18n.t('equals') },
]

export function operatorLabel(operator: RuleOperator): string {
    return (
        RULE_OPERATORS.find((op) => op.value === operator)?.label() ?? operator
    )
}

const COMPARISON_TO_LOGIC = {
    gt: '>',
    gte: '>=',
    lt: '<',
    eq: '==',
} as const

const LOGIC_TO_COMPARISON: Record<string, RuleOperator> = {
    '>': 'gt',
    '>=': 'gte',
    '<': 'lt',
    '==': 'eq',
}

const CONTEXT_PREFIX = 'context.'

function varOf(path: string) {
    return { var: `${CONTEXT_PREFIX}${path.trim()}` }
}

function rowToRule(row: RuleConditionRow): unknown {
    return {
        [COMPARISON_TO_LOGIC[row.operator]]: [
            varOf(row.path),
            Number(row.value.trim()),
        ],
    }
}

/** Rows to JSONLogic; no rows means "always" (null). */
export function buildRule(match: RuleMatch, rows: RuleConditionRow[]): unknown {
    if (rows.length === 0) {
        return null
    }
    const rules = rows.map(rowToRule)
    if (rules.length === 1) {
        return rules[0]
    }
    return { [match === 'all' ? 'and' : 'or']: rules }
}

function singleOperation(value: unknown): [string, unknown[]] | null {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        return null
    }
    const entries = Object.entries(value)
    if (entries.length !== 1) {
        return null
    }
    const [operator, args] = entries[0]!
    return [operator, Array.isArray(args) ? args : [args]]
}

function contextPathOf(value: unknown): string | null {
    const op = singleOperation(value)
    if (!op || op[0] !== 'var' || op[1].length !== 1) {
        return null
    }
    const path = op[1][0]
    if (typeof path !== 'string' || !path.startsWith(CONTEXT_PREFIX)) {
        return null
    }
    return path.slice(CONTEXT_PREFIX.length)
}

function ruleToRow(rule: unknown): RuleConditionRow | null {
    const op = singleOperation(rule)
    if (!op) {
        return null
    }
    const [operator, args] = op
    const path = contextPathOf(args[0])
    if (path === null) {
        return null
    }
    const comparison = LOGIC_TO_COMPARISON[operator]
    if (comparison && args.length === 2 && typeof args[1] === 'number') {
        return { path, operator: comparison, value: String(args[1]) }
    }
    return null
}

/** JSONLogic to rows, or null when the rule is not something the rows can express. */
export function parseRule(
    rule: unknown
): { match: RuleMatch; rows: RuleConditionRow[] } | null {
    if (rule === null || rule === undefined) {
        return { match: 'all', rows: [] }
    }
    const op = singleOperation(rule)
    if (op && (op[0] === 'and' || op[0] === 'or')) {
        const rows = op[1].map(ruleToRow)
        if (rows.length === 0 || rows.some((row) => row === null)) {
            return null
        }
        return {
            match: op[0] === 'and' ? 'all' : 'any',
            rows: rows as RuleConditionRow[],
        }
    }
    const row = ruleToRow(rule)
    return row ? { match: 'all', rows: [row] } : null
}

/**
 * A one-line, human-readable summary of a stored rule for tables. `labelPath` turns a
 * context path into something readable, e.g. "Pull data → Values pulled".
 */
export function describeRule(
    rule: unknown,
    labelPath: (path: string) => string = (path) => path
): string {
    if (rule === null || rule === undefined) {
        return i18n.t('Always')
    }
    const parsed = parseRule(rule)
    if (!parsed) {
        return i18n.t('Custom rule (set outside the app)')
    }
    const parts = parsed.rows.map((row) => {
        return `${labelPath(row.path)} ${operatorLabel(row.operator)} ${row.value}`
    })
    return parts.join(
        parsed.match === 'all' ? ` ${i18n.t('and')} ` : ` ${i18n.t('or')} `
    )
}
