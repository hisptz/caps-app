import { mergeDataElementOptions } from './mergeDataElementOptions'

describe('mergeDataElementOptions', () => {
    it('merges selected and paged rows without duplicates', () => {
        const result = mergeDataElementOptions(
            [
                { id: 'a', displayName: 'Alpha' },
                { id: 'b', displayName: 'Bravo' },
            ],
            [
                { id: 'b', displayName: 'Bravo selected' },
                { id: 'z', displayName: 'Zulu' },
            ]
        )

        expect(result).toEqual([
            { value: 'a', label: 'Alpha' },
            { value: 'b', label: 'Bravo selected' },
            { value: 'z', label: 'Zulu' },
        ])
    })

    it('sorts merged options by displayName', () => {
        const result = mergeDataElementOptions(
            [{ id: 'z', displayName: 'Zulu' }],
            [{ id: 'a', displayName: 'Alpha' }]
        )

        expect(result.map((option) => option.label)).toEqual(['Alpha', 'Zulu'])
    })
})
