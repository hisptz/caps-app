import { formatClimateTemporalExtent } from '@/modules/climate-data/utils/formatTemporalExtent'

describe('formatClimateTemporalExtent', () => {
    it('joins start and end when both are present', () => {
        expect(
            formatClimateTemporalExtent({
                start: '2024-01-01',
                end: '2024-12-31',
            })
        ).toBe('2024-01-01 – 2024-12-31')
    })

    it('uses an em dash for a missing bound', () => {
        expect(
            formatClimateTemporalExtent({ start: '2024-01-01', end: null })
        ).toBe('2024-01-01 – —')
        expect(
            formatClimateTemporalExtent({ start: null, end: '2024-12-31' })
        ).toBe('— – 2024-12-31')
    })

    it('returns n/a when both bounds are missing', () => {
        expect(formatClimateTemporalExtent({ start: null, end: null })).toBe(
            'n/a'
        )
        expect(formatClimateTemporalExtent(undefined)).toBe('n/a')
    })
})
