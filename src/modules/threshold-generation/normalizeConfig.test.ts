import {
    emitThresholdConfig,
    getOutputMode,
    hasDuplicateOutputMethods,
    normalizeThresholdConfigForLoad,
} from './normalizeConfig'

describe('normalizeThresholdConfigForLoad', () => {
    it('maps legacy calculation methods and org unit levels', () => {
        const result = normalizeThresholdConfigForLoad({
            orgUnit: { levels: ['3'] },
            period: {
                years: [2023, 2024],
                periodType: 'monthly',
            },
            dataElementIds: ['DE1'],
            calculationMethod: 'mean+2SD',
            outputDataElementId: 'OUT1',
        })

        expect(result.orgUnit).toEqual({ level: 3 })
        expect(result.period).toMatchObject({
            years: ['2023', '2024'],
            periodType: 'Monthly',
            yearsToInclude: 5,
        })
        expect(result.calculationMethod).toBe('mean + 2SD')
        expect(result.outputDataElementId).toBe('OUT1')
        expect(getOutputMode(result)).toBe('single')
    })

    it('preserves batch outputs mode', () => {
        const result = normalizeThresholdConfigForLoad({
            orgUnit: { ids: ['OU1'] },
            period: {
                years: ['2023'],
                periodType: 'Weekly',
            },
            dataElementIds: ['DE1'],
            outputs: [
                { calculationMethod: 'mean', outputDataElementId: 'A' },
                {
                    calculationMethod: '75th percentile',
                    outputDataElementId: 'B',
                },
            ],
        })

        expect(getOutputMode(result)).toBe('batch')
        expect(result.outputs).toHaveLength(2)
        expect(result.calculationMethod).toBeUndefined()
    })
})

describe('emitThresholdConfig', () => {
    it('strips batch fields in single mode', () => {
        const emitted = emitThresholdConfig(
            {
                calculationMethod: 'mean',
                outputDataElementId: 'OUT',
                outputs: [
                    { calculationMethod: 'SD', outputDataElementId: 'X' },
                ],
            },
            'single'
        )
        expect(emitted.outputs).toBeUndefined()
        expect(emitted.calculationMethod).toBe('mean')
    })

    it('strips single fields in batch mode', () => {
        const emitted = emitThresholdConfig(
            {
                calculationMethod: 'mean',
                outputDataElementId: 'OUT',
            },
            'batch'
        )
        expect(emitted.calculationMethod).toBeUndefined()
        expect(emitted.outputDataElementId).toBeUndefined()
        expect(Array.isArray(emitted.outputs)).toBe(true)
    })
})

describe('hasDuplicateOutputMethods', () => {
    it('detects duplicate methods', () => {
        expect(
            hasDuplicateOutputMethods([
                { calculationMethod: 'mean', outputDataElementId: 'A' },
                { calculationMethod: 'mean', outputDataElementId: 'B' },
            ])
        ).toBe(true)
    })
})
