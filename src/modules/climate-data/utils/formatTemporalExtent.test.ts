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

    it('names monthly periods so the end month reads as included', () => {
        expect(
            formatClimateTemporalExtent(
                { start: '2024-01-01', end: '2026-09-01' },
                'monthly',
                'en'
            )
        ).toBe('January 2024 – September 2026')
    })

    it('names quarterly and yearly periods', () => {
        expect(
            formatClimateTemporalExtent(
                { start: '2024-01-01', end: '2026-07-01' },
                'quarterly'
            )
        ).toBe('2024 Q1 – 2026 Q3')
        expect(
            formatClimateTemporalExtent(
                { start: '2000-01-01', end: '2025-01-01' },
                'yearly'
            )
        ).toBe('2000 – 2025')
    })

    it('keeps dates for daily, weekly and irregular periods', () => {
        for (const periodType of ['daily', 'weekly', 'irregular']) {
            expect(
                formatClimateTemporalExtent(
                    { start: '2024-01-01', end: '2024-12-31' },
                    periodType
                )
            ).toBe('2024-01-01 – 2024-12-31')
        }
    })

    it('formats a single bound and leaves the missing one as a dash', () => {
        expect(
            formatClimateTemporalExtent(
                { start: '2024-01-01', end: null },
                'yearly'
            )
        ).toBe('2024 – —')
    })
})
