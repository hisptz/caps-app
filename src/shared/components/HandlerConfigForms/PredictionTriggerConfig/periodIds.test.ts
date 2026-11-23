import {
    lastCompletePeriodId,
    periodIdAtOffset,
} from '@/shared/components/HandlerConfigForms/PredictionTriggerConfig/periodIds'

describe('periodIdAtOffset', () => {
    // Wednesday of ISO week 2026W48.
    const now = new Date(2026, 10, 25)

    it('treats offset 1 as the last complete week', () => {
        expect(periodIdAtOffset('week', 1, now)).toBe('2026W47')
        expect(lastCompletePeriodId('week', now)).toBe('2026W47')
    })

    it('moves further back for a larger offset', () => {
        expect(periodIdAtOffset('week', 4, now)).toBe('2026W44')
    })

    it('crosses into the previous ISO week-year', () => {
        // Monday of 2027W02.
        expect(periodIdAtOffset('week', 4, new Date(2027, 0, 11))).toBe(
            '2026W51'
        )
    })

    it('counts months back for monthly setups', () => {
        expect(periodIdAtOffset('month', 3, now)).toBe('202608')
        expect(periodIdAtOffset('month', 12, now)).toBe('202511')
    })
})
