import { emitOrgUnitConfig, normalizeOrgUnitConfig } from './normalizeOrgUnit'

describe('normalizeOrgUnitConfig', () => {
    it('trims, dedupes and coerces selectors, dropping invalid values', () => {
        expect(
            normalizeOrgUnitConfig({
                ids: [' OU1 ', 'OU1', ''],
                levels: ['2', 2, 0, 'x'],
                groups: ['G1', ' '],
            })
        ).toEqual({
            ids: ['OU1'],
            levels: [2],
            groups: ['G1'],
        })
    })

    it('ignores fields outside the caps-engine schema', () => {
        expect(
            normalizeOrgUnitConfig({ level: 2, groupId: 'G1', ids: ['OU1'] })
        ).toEqual({ ids: ['OU1'] })
    })

    it('allows combined selectors', () => {
        expect(
            emitOrgUnitConfig({
                ids: ['OU1'],
                levels: [2, 3],
                groups: ['G1', 'G2'],
            })
        ).toEqual({
            ids: ['OU1'],
            levels: [2, 3],
            groups: ['G1', 'G2'],
        })
    })
})
