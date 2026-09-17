import {
    filterPeriodsWithinCoverage,
    getCoverageYearRange,
    normalizeDatasetPeriodType,
    periodOverlapsCoverage,
} from './climateDatasetPeriodUtils'

describe('climateDatasetPeriodUtils', () => {
    it('normalizes dataset period types to handler values', () => {
        expect(normalizeDatasetPeriodType('monthly')).toBe('monthly')
        expect(normalizeDatasetPeriodType('MONTHLY')).toBe('monthly')
        expect(normalizeDatasetPeriodType('yearly')).toBeUndefined()
    })

    it('filters periods to those overlapping dataset coverage', () => {
        const periods = [
            {
                id: '202312',
                name: 'December 2023',
                startDate: '2023-12-01',
                endDate: '2023-12-31',
            },
            {
                id: '202401',
                name: 'January 2024',
                startDate: '2024-01-01',
                endDate: '2024-01-31',
            },
        ]

        expect(
            filterPeriodsWithinCoverage(
                periods,
                '2023-12-15',
                '2024-01-15'
            ).map((period) => period.id)
        ).toEqual(['202312', '202401'])

        expect(
            filterPeriodsWithinCoverage(
                periods,
                '2024-01-01',
                '2024-01-31'
            ).map((period) => period.id)
        ).toEqual(['202401'])
    })

    it('derives year range from coverage dates', () => {
        expect(getCoverageYearRange('2020-01-01', '2024-12-31')).toEqual({
            minYear: 2020,
            maxYear: 2024,
        })
    })

    it('falls back to the current year window when coverage is missing', () => {
        const currentYear = new Date().getFullYear()
        expect(getCoverageYearRange(null, null)).toEqual({
            minYear: currentYear - 9,
            maxYear: currentYear,
        })
    })

    it('detects period overlap with coverage window', () => {
        expect(
            periodOverlapsCoverage(
                { startDate: '2024-01-01', endDate: '2024-01-31' },
                { start: '2023-12-15', end: '2024-01-15' }
            )
        ).toBe(true)

        expect(
            periodOverlapsCoverage(
                { startDate: '2023-11-01', endDate: '2023-11-30' },
                { start: '2023-12-15', end: '2024-01-15' }
            )
        ).toBe(false)
    })
})
