import { collectHandlerConfigErrorMessages } from './collectHandlerConfigErrorMessages'

describe('collectHandlerConfigErrorMessages', () => {
    it('returns empty array when there are no errors', () => {
        expect(collectHandlerConfigErrorMessages(undefined)).toEqual([])
    })

    it('collects a root message on handlerConfig', () => {
        expect(
            collectHandlerConfigErrorMessages({
                message: 'Handler configuration is required',
                type: 'custom',
            })
        ).toEqual(['Handler configuration is required'])
    })

    it('collects nested field messages', () => {
        expect(
            collectHandlerConfigErrorMessages({
                datasetId: {
                    message: 'Dataset is required',
                    type: 'custom',
                },
                variable: {
                    dataElement: {
                        message: 'Data element is required',
                        type: 'custom',
                    },
                },
            })
        ).toEqual(['Dataset is required', 'Data element is required'])
    })

    it('deduplicates identical messages', () => {
        expect(
            collectHandlerConfigErrorMessages({
                a: { message: 'Same', type: 'custom' },
                b: { message: 'Same', type: 'custom' },
            })
        ).toEqual(['Same'])
    })
})
