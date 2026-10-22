import {
    type PushMeta,
    pushItemStatus,
} from '@/modules/dhis2-instance-push/utils/pushItemStatus'

const DEFAULT: PushMeta = {
    isDefault: true,
    optionCombos: [{ id: 'HllvX50cXC0', name: 'default' }],
    valueType: 'NUMBER',
    aggregationType: 'SUM',
}

function combos(
    pairs: Array<[string, string]>,
    extra: Partial<PushMeta> = {}
): PushMeta {
    return {
        isDefault: false,
        optionCombos: pairs.map(([id, name]) => ({ id, name })),
        valueType: 'NUMBER',
        aggregationType: 'SUM',
        ...extra,
    }
}

describe('pushItemStatus', () => {
    it('is unknown until both sides are loaded', () => {
        expect(pushItemStatus(DEFAULT, undefined)).toEqual({ kind: 'unknown' })
        expect(pushItemStatus(undefined, DEFAULT)).toEqual({ kind: 'unknown' })
    })

    it('sends totals as they are', () => {
        expect(pushItemStatus(DEFAULT, DEFAULT)).toEqual({ kind: 'total' })
    })

    it('sums option combos into a target without categories for SUM data elements', () => {
        expect(pushItemStatus(combos([['a', 'Male']]), DEFAULT)).toEqual({
            kind: 'sum',
        })
    })

    it('refuses to sum other aggregation types', () => {
        const status = pushItemStatus(
            combos([['a', 'Male']], { aggregationType: 'AVERAGE' }),
            DEFAULT
        )
        expect(status.kind).toBe('problem')
    })

    it('takes the analytics total for any aggregation type', () => {
        expect(
            pushItemStatus(
                combos([['a', 'Male']], { aggregationType: 'AVERAGE' }),
                DEFAULT,
                'analytics'
            )
        ).toEqual({ kind: 'total' })
    })

    it('can’t split a total into a target with categories', () => {
        expect(pushItemStatus(DEFAULT, combos([['b', 'Male']])).kind).toBe(
            'problem'
        )
    })

    it('pairs option combos by name and lists the unmatched ones', () => {
        const status = pushItemStatus(
            combos([
                ['stgMale', 'Male, <5'],
                ['stgOther', 'Other, <5'],
            ]),
            combos([['tgtMale', '<5, male']])
        )
        expect(status).toEqual({
            kind: 'combos',
            pairs: [
                {
                    sourceId: 'stgMale',
                    sourceName: 'Male, <5',
                    stagingId: 'tgtMale',
                    stagingName: '<5, male',
                },
            ],
            unmatched: [{ id: 'stgOther', name: 'Other, <5' }],
        })
    })

    it('refuses decimals into a whole-number target', () => {
        expect(
            pushItemStatus(DEFAULT, { ...DEFAULT, valueType: 'INTEGER' }).kind
        ).toBe('problem')
    })
})
