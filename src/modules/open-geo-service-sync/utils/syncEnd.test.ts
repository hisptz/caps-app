import { getSyncEndGranularity, monthEndDate, parseSyncEnd } from './syncEnd'

describe('getSyncEndGranularity', () => {
    it('picks months when every dataset is monthly', () => {
        expect(getSyncEndGranularity(['monthly', 'MONTHLY'])).toBe('month')
    })

    it('picks months when monthly and yearly datasets are mixed', () => {
        expect(getSyncEndGranularity(['monthly', 'yearly'])).toBe('month')
    })

    it('picks years when every dataset is yearly', () => {
        expect(getSyncEndGranularity(['yearly'])).toBe('year')
    })

    it('falls back to days when any dataset is finer than a month', () => {
        expect(getSyncEndGranularity(['monthly', 'daily'])).toBe('day')
        expect(getSyncEndGranularity(['dekadal'])).toBe('day')
    })

    it('falls back to days when nothing is selected or the type is unknown', () => {
        expect(getSyncEndGranularity([])).toBe('day')
        expect(getSyncEndGranularity([undefined])).toBe('day')
    })
})

describe('monthEndDate', () => {
    it('returns the last day of the month', () => {
        expect(monthEndDate(2026, 9)).toBe('2026-09-30')
        expect(monthEndDate(2024, 2)).toBe('2024-02-29')
        expect(monthEndDate(2026, 12)).toBe('2026-12-31')
    })
})

describe('parseSyncEnd', () => {
    it('reads the year and month of a stored date', () => {
        expect(parseSyncEnd('2026-09-15')).toEqual({ year: 2026, month: 9 })
    })

    it('ignores empty or malformed values', () => {
        expect(parseSyncEnd(undefined)).toBeUndefined()
        expect(parseSyncEnd('2026-09')).toBeUndefined()
    })
})
