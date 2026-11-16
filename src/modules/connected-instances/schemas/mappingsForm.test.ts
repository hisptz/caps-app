import {
    formValuesToPutBody,
    instanceToFormValues,
    mappingsFormSchema,
    parseSaveInstanceConflict,
    rowsTakenByOtherInstances,
} from './mappingsForm'
import type { InstanceDetail, MappingWithInstance } from '@/capsApi/types'

const ROUTE = 'caps-src-hmis'
const OTHER = 'caps-src-lmis'
const CASES = 'CasesAAAAAA'
const RATE = 'RateAAAAAAA'
const STAGING_RATE = 'StgRateAAAA'
const PREDICTED = 'PredictedAA'
const HMIS_PREDICTED = 'HmisPredAAA'

const instance: InstanceDetail = {
    routeCode: ROUTE,
    configured: true,
    orgUnitMatch: 'code',
    mappings: [
        {
            remoteItem: CASES,
            remoteItemType: 'DATA_ELEMENT',
            stagingDataElement: CASES,
            direction: 'PULL',
        },
        {
            remoteItem: RATE,
            remoteItemType: 'INDICATOR',
            stagingDataElement: STAGING_RATE,
            direction: 'PULL',
        },
        {
            remoteItem: HMIS_PREDICTED,
            remoteItemType: 'DATA_ELEMENT',
            stagingDataElement: PREDICTED,
            direction: 'PUSH',
        },
    ],
    steps: [],
}

const other = (
    over: Partial<MappingWithInstance> = {}
): MappingWithInstance => ({
    routeCode: OTHER,
    remoteItem: 'OtherAAAAAA',
    remoteItemType: 'DATA_ELEMENT',
    stagingDataElement: CASES,
    direction: 'PULL',
    ...over,
})

describe('instance mappings form', () => {
    it('splits mappings by direction, in each step’s row shape, and back', () => {
        const values = instanceToFormValues(instance)
        expect(values.pull).toEqual([
            { from: CASES, fromType: 'DATA_ELEMENT', into: undefined },
            { from: RATE, fromType: 'INDICATOR', into: STAGING_RATE },
        ])
        expect(values.push).toEqual([{ from: PREDICTED, into: HMIS_PREDICTED }])
        expect(formValuesToPutBody(values)).toEqual({
            orgUnitMatch: 'code',
            mappings: instance.mappings,
        })
    })

    it('pairs each staging data element once, across pull and push', () => {
        const result = mappingsFormSchema.safeParse({
            orgUnitMatch: 'id',
            pull: [{ from: CASES, fromType: 'DATA_ELEMENT' }],
            push: [{ from: CASES, into: HMIS_PREDICTED }],
        })
        expect(result.error?.issues.map((i) => i.path)).toEqual([
            ['push', 0, 'from'],
        ])
    })

    it('pairs each remote item once, across pull and push', () => {
        const result = mappingsFormSchema.safeParse({
            orgUnitMatch: 'id',
            pull: [{ from: CASES, fromType: 'DATA_ELEMENT', into: PREDICTED }],
            push: [{ from: STAGING_RATE, into: CASES }],
        })
        expect(result.error?.issues.map((i) => i.path)).toEqual([
            ['push', 0, 'into'],
        ])
    })

    it('flags pulling into what another instance pulls into, not what it receives', () => {
        const pull = instanceToFormValues(instance).pull
        expect(rowsTakenByOtherInstances(ROUTE, pull, [other()])).toEqual([
            { index: 0, routeCode: OTHER },
        ])
        expect(
            rowsTakenByOtherInstances(ROUTE, pull, [
                other({ direction: 'PUSH' }),
            ])
        ).toEqual([])
    })

    it('reads the API’s 409 bodies', () => {
        expect(
            parseSaveInstanceConflict({
                code: 'instance_mapping_conflict',
                details: { taken: [] },
            })
        ).toEqual({ kind: 'taken', taken: [] })
        expect(
            parseSaveInstanceConflict({
                code: 'instance_mapping_in_use',
                details: { steps: [] },
            })
        ).toEqual({ kind: 'in-use', steps: [] })
        expect(parseSaveInstanceConflict({ code: 'other' })).toBeNull()
    })
})
