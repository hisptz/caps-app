import { emitAlertConfig, normalizeAlertConfigForLoad } from './normalizeConfig'

describe('alert-generation normalizeConfig', () => {
    it('normalizes empty config with editable period row and value DE row', () => {
        const normalized = normalizeAlertConfigForLoad(null)
        expect(normalized.period).toEqual({ periods: [''] })
        expect(normalized.aggregationType).toBe('SUM')
        expect(normalized.valueDataElementIds).toEqual([''])
        expect(normalized).not.toHaveProperty('valueDataElementId')
    })

    it('migrates legacy valueDataElementId to valueDataElementIds on load', () => {
        const normalized = normalizeAlertConfigForLoad({
            valueDataElementId: 'DE_MEDIAN',
            thresholdDataElementId: 'DE_THRESH',
        })
        expect(normalized.valueDataElementIds).toEqual(['DE_MEDIAN'])
        expect(normalized).not.toHaveProperty('valueDataElementId')
    })

    it('prefers valueDataElementIds over legacy valueDataElementId on load', () => {
        const normalized = normalizeAlertConfigForLoad({
            valueDataElementId: 'DE_LEGACY',
            valueDataElementIds: ['DE_Q1', 'DE_Q2'],
        })
        expect(normalized.valueDataElementIds).toEqual(['DE_Q1', 'DE_Q2'])
    })

    it('emitAlertConfig strips empty periods and merges org unit selectors', () => {
        const emitted = emitAlertConfig({
            orgUnit: {
                ids: ['OU1', 'OU2'],
                levels: [3],
                groups: ['G1'],
            },
            period: { periods: ['202301', '', '  '] },
            thresholdDataElementId: ' DE_THRESH ',
            valueDataElementIds: ['DE_VAL'],
            aggregationType: 'MEAN',
        })
        expect(emitted).toEqual({
            orgUnit: {
                ids: ['OU1', 'OU2'],
                levels: [3],
                groups: ['G1'],
            },
            period: { periods: ['202301'] },
            thresholdDataElementId: 'DE_THRESH',
            valueDataElementIds: ['DE_VAL'],
            aggregationType: 'MEAN',
        })
        expect(emitted).not.toHaveProperty('valueDataElementId')
    })

    it('emitAlertConfig trims, filters empty value DE ids, and omits legacy field', () => {
        const emitted = emitAlertConfig({
            orgUnit: { ids: [] },
            period: { periods: ['202301'] },
            thresholdDataElementId: 'DE_THRESH',
            valueDataElementIds: [' DE_Q1 ', '', 'DE_Q2', '  '],
            valueDataElementId: 'DE_SHOULD_NOT_EMIT',
        })
        expect(emitted.valueDataElementIds).toEqual(['DE_Q1', 'DE_Q2'])
        expect(emitted).not.toHaveProperty('valueDataElementId')
    })

    it('emitAlertConfig emits multiple quantile data element UIDs', () => {
        const emitted = emitAlertConfig({
            orgUnit: { ids: [] },
            period: { periods: ['202301'] },
            thresholdDataElementId: 'DE_THRESH',
            valueDataElementIds: ['DE_010', 'DE_025', 'DE_050'],
        })
        expect(emitted.valueDataElementIds).toEqual([
            'DE_010',
            'DE_025',
            'DE_050',
        ])
    })

    it('emitAlertConfig migrates legacy valueDataElementId when array absent', () => {
        const emitted = emitAlertConfig({
            orgUnit: { ids: ['OU1'] },
            period: { periods: ['202301'] },
            thresholdDataElementId: 'DE_THRESH',
            valueDataElementId: 'DE_VAL',
        })
        expect(emitted.valueDataElementIds).toEqual(['DE_VAL'])
        expect(emitted).not.toHaveProperty('valueDataElementId')
    })
})
