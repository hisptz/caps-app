import { rowState } from './rowState'

const staging = new Map([
    ['fbfJHSPpUQD', 'ANC 1st visit'],
    ['tStgRate001', 'ANC coverage (CAPS)'],
])

describe('rowState', () => {
    it('is unset until a source item is picked', () => {
        expect(rowState({}, staging)).toEqual({ kind: 'unset' })
    })

    it('links a data element that staging has under the same ID', () => {
        expect(
            rowState({ from: 'fbfJHSPpUQD', fromType: 'DATA_ELEMENT' }, staging)
        ).toEqual({ kind: 'linked', targetName: 'ANC 1st visit' })
    })

    it('asks for a staging data element when no ID matches', () => {
        expect(
            rowState({ from: 'x3Do5e7g4Qo', fromType: 'DATA_ELEMENT' }, staging)
        ).toEqual({ kind: 'pick', reason: 'no-match' })
    })

    it('asks for a staging data element for indicators, even while loading', () => {
        expect(
            rowState({ from: 'Uvn6LCg7dVU', fromType: 'INDICATOR' }, undefined)
        ).toEqual({ kind: 'pick', reason: 'not-a-data-element' })
    })

    it('creates instead of asking when creation is switched on', () => {
        const opts = { allowCreate: true }
        expect(
            rowState(
                { from: 'x3Do5e7g4Qo', fromType: 'DATA_ELEMENT' },
                staging,
                opts
            )
        ).toEqual({ kind: 'create', newId: false })
        expect(
            rowState(
                { from: 'Uvn6LCg7dVU', fromType: 'INDICATOR' },
                undefined,
                opts
            )
        ).toEqual({ kind: 'create', newId: true })
    })

    it('shows the mapped staging data element', () => {
        expect(
            rowState(
                {
                    from: 'Uvn6LCg7dVU',
                    fromType: 'INDICATOR',
                    into: 'tStgRate001',
                },
                staging
            )
        ).toEqual({ kind: 'mapped', targetName: 'ANC coverage (CAPS)' })
    })

    it('flags a target that no longer exists', () => {
        expect(
            rowState(
                {
                    from: 'x3Do5e7g4Qo',
                    fromType: 'DATA_ELEMENT',
                    into: 'gOnE0000001',
                },
                staging
            )
        ).toEqual({ kind: 'missing', targetId: 'gOnE0000001' })
    })

    it('is checking while staging status loads', () => {
        expect(
            rowState(
                { from: 'fbfJHSPpUQD', fromType: 'DATA_ELEMENT' },
                undefined
            )
        ).toEqual({ kind: 'checking' })
    })
})
