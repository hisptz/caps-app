import { itemComboStatus } from './categoryCombos'
import { valueTypeProblem } from './valueTypes'

describe('valueTypeProblem', () => {
    it('accepts numeric targets that can hold the values', () => {
        expect(
            valueTypeProblem('DATA_ELEMENT', 'INTEGER', 'INTEGER')
        ).toBeNull()
        expect(valueTypeProblem('INDICATOR', undefined, 'NUMBER')).toBeNull()
        expect(
            valueTypeProblem('PROGRAM_INDICATOR', undefined, 'INTEGER')
        ).toBeNull()
    })

    it('leaves unknown value types to the import', () => {
        expect(valueTypeProblem('INDICATOR', undefined, undefined)).toBeNull()
    })

    it('refuses targets that do not hold numbers', () => {
        expect(valueTypeProblem('DATA_ELEMENT', 'INTEGER', 'TEXT')).toMatch(
            /TEXT values/
        )
    })

    it('refuses decimals into whole-number targets', () => {
        expect(
            valueTypeProblem('INDICATOR', undefined, 'INTEGER_POSITIVE')
        ).toMatch(/whole numbers/)
        expect(valueTypeProblem('DATA_ELEMENT', 'NUMBER', 'INTEGER')).toMatch(
            /whole numbers/
        )
    })
})

describe('itemComboStatus with value types', () => {
    it('reports a value type problem before looking at categories', () => {
        const status = itemComboStatus({ fromType: 'INDICATOR' }, undefined, {
            isDefault: true,
            optionCombos: [],
            valueType: 'BOOLEAN',
        })
        expect(status).toEqual({
            kind: 'problem',
            message: expect.stringMatching(/BOOLEAN values/),
        })
    })
})
