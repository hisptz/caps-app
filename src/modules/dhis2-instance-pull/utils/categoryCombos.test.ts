import {
    itemComboStatus,
    matchCategoryOptionCombos,
    normalizeComboName,
} from './categoryCombos'

const combos = (...list: Array<[string, string]>) => ({
    isDefault: false,
    optionCombos: list.map(([id, name]) => ({ id, name })),
})
const DEFAULT = { isDefault: true, optionCombos: [] }
const source = combos(
    ['s1', '<5, Male'],
    ['s2', '<5, Female'],
    ['s3', '5+, Male']
)

describe('matchCategoryOptionCombos', () => {
    it('ignores option order, case and spacing in names', () => {
        expect(normalizeComboName('Male, <5')).toBe(
            normalizeComboName('<5,  male')
        )
    })

    it('matches by ID, then by name, each staging combo once', () => {
        const staging = combos(
            ['s1', '<5, Male'],
            ['t2', 'Female, <5'],
            ['t3', '<5, Male']
        )
        expect(matchCategoryOptionCombos(source, staging)).toMatchObject({
            kind: 'combos',
            pairs: [
                { sourceId: 's1', stagingId: 's1' },
                { sourceId: 's2', stagingId: 't2' },
            ],
            unmatched: [{ id: 's3', name: '5+, Male' }],
        })
    })
})

describe('itemComboStatus', () => {
    const de = { fromType: 'DATA_ELEMENT' as const }

    it('is a total when staging has no categories', () => {
        expect(itemComboStatus(de, source, DEFAULT)).toEqual({ kind: 'total' })
    })

    it('lists unmatched option combos, which block the item', () => {
        const staging = combos(['s1', '<5, Male'])
        expect(itemComboStatus(de, source, staging)).toMatchObject({
            kind: 'combos',
            unmatched: [
                { id: 's2', name: '<5, Female' },
                { id: 's3', name: '5+, Male' },
            ],
        })
    })

    it('reports indicators into a data element with categories', () => {
        expect(
            itemComboStatus({ fromType: 'INDICATOR' }, undefined, source)
        ).toMatchObject({ kind: 'problem' })
    })

    it('reports a source without categories going into one with categories', () => {
        expect(itemComboStatus(de, DEFAULT, source)).toMatchObject({
            kind: 'problem',
        })
    })

    it('is unknown while either side is loading', () => {
        expect(itemComboStatus(de, source, undefined)).toEqual({
            kind: 'unknown',
        })
        expect(itemComboStatus(de, undefined, source)).toEqual({
            kind: 'unknown',
        })
    })
})
