import { relativeWindow } from './periods'

describe('relativeWindow', () => {
    const september = new Date('2026-09-15T10:00:00Z')

    it('skips the current month with offset 1', () => {
        expect(
            relativeWindow(
                {
                    mode: 'relative',
                    periodType: 'MONTHLY',
                    count: 3,
                    offset: 1,
                },
                september
            )
        ).toEqual({ first: '202606', last: '202608' })
    })

    it('crosses the ISO week-year boundary like the engine', () => {
        expect(
            relativeWindow(
                {
                    mode: 'relative',
                    periodType: 'WEEKLY',
                    count: 3,
                    offset: 1,
                },
                new Date('2026-01-07T08:00:00Z')
            )
        ).toEqual({ first: '2025W51', last: '2026W1' })
    })

    it('crosses the calendar year for months', () => {
        expect(
            relativeWindow(
                {
                    mode: 'relative',
                    periodType: 'MONTHLY',
                    count: 2,
                    offset: 0,
                },
                new Date('2026-01-20T00:00:00Z')
            )
        ).toEqual({ first: '202512', last: '202601' })
    })

    it('is null for fixed ranges', () => {
        expect(
            relativeWindow({
                mode: 'fixed',
                periodType: 'MONTHLY',
                start: '202601',
                end: '202603',
            })
        ).toBeNull()
    })
})
