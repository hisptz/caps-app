import { emitOrgUnitConfig, normalizeOrgUnitConfig } from './normalizeOrgUnit'

describe('normalizeOrgUnitConfig', () => {
    it('merges legacy singular fields into plural arrays', () => {
        expect(
            normalizeOrgUnitConfig({
                ids: ['OU1'],
                level: 2,
                groupId: 'G1',
            })
        ).toEqual({
            ids: ['OU1'],
            levels: [2],
            groupIds: ['G1'],
        })
    })

    it('allows combined selectors', () => {
        expect(
            emitOrgUnitConfig({
                ids: ['OU1'],
                levels: [2, 3],
                groupIds: ['G1', 'G2'],
            })
        ).toEqual({
            ids: ['OU1'],
            levels: [2, 3],
            groupIds: ['G1', 'G2'],
        })
    })
})
