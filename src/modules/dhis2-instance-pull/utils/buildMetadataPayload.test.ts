import { buildMetadataPayload, planCreations } from './buildMetadataPayload'

const group = { name: '[CAPS] Imported', shortName: 'CAPS imported' }

describe('planCreations', () => {
    it('creates missing data elements and target-less indicators, and reports missing picks', () => {
        const existing = new Set(['linkedDE001', 'mappedDE001'])
        const plan = planCreations(
            [
                { from: 'linkedDE001', fromType: 'DATA_ELEMENT' },
                { from: 'missingDE01', fromType: 'DATA_ELEMENT' },
                {
                    from: 'someDE00001',
                    fromType: 'DATA_ELEMENT',
                    into: 'mappedDE001',
                },
                { from: 'indicator01', fromType: 'INDICATOR' },
                {
                    from: 'indicator02',
                    fromType: 'INDICATOR',
                    into: 'mappedDE001',
                },
                {
                    from: 'progInd0001',
                    fromType: 'PROGRAM_INDICATOR',
                    into: 'goneDE00001',
                },
                {
                    from: 'otherDE0001',
                    fromType: 'DATA_ELEMENT',
                    into: 'goneDE00002',
                },
            ],
            existing
        )
        expect(plan.creations).toEqual([
            { index: 1, type: 'DATA_ELEMENT', targetId: 'missingDE01' },
            { index: 3, type: 'INDICATOR' },
        ])
        expect(plan.missingTargets).toEqual(['goneDE00001', 'goneDE00002'])
    })
})

describe('buildMetadataPayload', () => {
    const creations = [
        {
            type: 'DATA_ELEMENT' as const,
            targetId: 'missingDE01',
            source: {
                id: 'missingDE01',
                name: 'Malaria tested, outpatient',
                shortName: 'Malaria tested OPD',
                code: 'MAL_TESTED_OPD',
                valueType: 'INTEGER_ZERO_OR_POSITIVE',
                aggregationType: 'SUM',
            },
        },
        {
            type: 'INDICATOR' as const,
            targetId: 'newDE000001',
            source: {
                id: 'indicator01',
                name: 'Malaria positivity rate',
                code: 'IND_CODE',
            },
            aggregationType: 'AVERAGE' as const,
        },
    ]

    it('copies data element fields, makes indicators NUMBER elements, and creates the group', () => {
        const plan = buildMetadataPayload({
            creations,
            group: { ...group, newId: 'newGroup001' },
        })
        expect(plan.metadata.dataElements).toEqual([
            {
                id: 'missingDE01',
                name: 'Malaria tested, outpatient',
                shortName: 'Malaria tested OPD',
                code: 'MAL_TESTED_OPD',
                valueType: 'INTEGER_ZERO_OR_POSITIVE',
                aggregationType: 'SUM',
                domainType: 'AGGREGATE',
                zeroIsSignificant: false,
            },
            {
                id: 'newDE000001',
                name: 'Malaria positivity rate',
                shortName: 'Malaria positivity rate',
                valueType: 'NUMBER',
                aggregationType: 'AVERAGE',
                domainType: 'AGGREGATE',
                zeroIsSignificant: false,
            },
        ])
        expect(plan.metadata.dataElementGroups).toEqual([
            {
                id: 'newGroup001',
                code: 'CAPS_IMPORTED',
                name: '[CAPS] Imported',
                shortName: 'CAPS imported',
                dataElements: [{ id: 'missingDE01' }, { id: 'newDE000001' }],
            },
        ])
        expect(plan.groupAdditions).toEqual([])
    })

    it('adds to an existing group instead of creating one', () => {
        const plan = buildMetadataPayload({
            creations,
            group: { ...group, existingId: 'oldGroup001' },
        })
        expect(plan.metadata.dataElementGroups).toBeUndefined()
        expect(plan.groupAdditions).toEqual(['missingDE01', 'newDE000001'])
    })

    it('falls back to SUM for unusable aggregation types and trims short names', () => {
        const plan = buildMetadataPayload({
            creations: [
                {
                    type: 'DATA_ELEMENT',
                    targetId: 'missingDE02',
                    source: {
                        id: 'missingDE02',
                        name: 'A'.repeat(80),
                        aggregationType: 'NONE',
                    },
                },
            ],
            group: { ...group, existingId: 'oldGroup001' },
        })
        expect(plan.metadata.dataElements[0]).toMatchObject({
            shortName: 'A'.repeat(50),
            aggregationType: 'SUM',
            valueType: 'NUMBER',
        })
    })
})
