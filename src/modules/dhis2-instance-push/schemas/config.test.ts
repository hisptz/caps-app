import {
    defaultDhis2InstancePushConfig,
    dhis2InstancePushConfigSchema,
    isDhis2InstancePushConfigShape,
    pushItemTarget,
} from '@/modules/dhis2-instance-push/schemas/config'

describe('dhis2InstancePushConfigSchema', () => {
    it('fills defaults for a minimal config', () => {
        const parsed = dhis2InstancePushConfigSchema.parse({
            routeCode: 'caps-src-hmis',
            items: [{ from: 'fbfJHSPpUQD' }],
            orgUnit: { levels: [2] },
            period: { mode: 'updated', days: 7 },
        })
        expect(parsed).toMatchObject({
            orgUnitMatch: 'id',
            importStrategy: 'CREATE_AND_UPDATE',
            chunk: { orgUnits: 50, values: 2000 },
        })
    })

    it('needs a connected instance and at least one data element', () => {
        const result = dhis2InstancePushConfigSchema.safeParse(
            defaultDhis2InstancePushConfig()
        )
        expect(result.success).toBe(false)
        const paths = result.error!.issues.map((issue) => issue.path[0])
        expect(paths).toEqual(expect.arrayContaining(['routeCode', 'items']))
    })

    it('accepts the period ranges pull uses', () => {
        const parsed = dhis2InstancePushConfigSchema.safeParse({
            routeCode: 'caps-src-hmis',
            items: [{ from: 'fbfJHSPpUQD' }],
            orgUnit: { levels: [2] },
            period: {
                mode: 'relative',
                periodType: 'MONTHLY',
                count: 3,
                offset: 1,
            },
        })
        expect(parsed.success).toBe(true)
    })

    it('recognises a push config shape', () => {
        expect(
            isDhis2InstancePushConfigShape(defaultDhis2InstancePushConfig())
        ).toBe(true)
        expect(isDhis2InstancePushConfigShape({ items: [] })).toBe(false)
    })

    it('targets the same ID unless another is picked', () => {
        expect(pushItemTarget({ from: 'fbfJHSPpUQD' })).toBe('fbfJHSPpUQD')
        expect(
            pushItemTarget({ from: 'fbfJHSPpUQD', into: 'tgtCases001' })
        ).toBe('tgtCases001')
    })
})
