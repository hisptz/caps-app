import { filterOptionsByLabel } from '@/shared/components/ui/FormPrimitives/SearchableSimpleSelectField'

describe('filterOptionsByLabel', () => {
    const options = [
        { label: 'Malaria weekly — EWARS', value: '1' },
        { label: 'Dengue monthly — ARIMA', value: '2' },
        { label: 'Malaria monthly — ARIMA', value: '3' },
    ]

    it('returns every option for an empty or blank search', () => {
        expect(filterOptionsByLabel(options, '')).toEqual(options)
        expect(filterOptionsByLabel(options, '   ')).toEqual(options)
    })

    it('matches anywhere in the label, ignoring case', () => {
        expect(
            filterOptionsByLabel(options, 'arima').map(({ value }) => value)
        ).toEqual(['2', '3'])
        expect(
            filterOptionsByLabel(options, ' MALARIA ').map(({ value }) => value)
        ).toEqual(['1', '3'])
    })

    it('returns nothing when no label matches', () => {
        expect(filterOptionsByLabel(options, 'cholera')).toEqual([])
    })
})
