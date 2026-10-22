import {
    generalPlaceholders,
    stepOutputPlaceholders,
} from '@/modules/dhis2-notify/utils/placeholders'

describe('notify placeholders', () => {
    it('offers the general placeholders with their exact tokens', () => {
        expect(generalPlaceholders().map((p) => p.token)).toEqual([
            '{{pipelineName}}',
            '{{runUrl}}',
            '{{date}}',
            '{{stepName}}',
        ])
    })

    it('offers the previous step’s output fields as input placeholders', () => {
        expect(
            stepOutputPlaceholders('dhis2-data-upload').map((p) => p.token)
        ).toEqual([
            '{{input.imported}}',
            '{{input.updated}}',
            '{{input.ignored}}',
            '{{input.status}}',
        ])
    })

    it('offers none for steps without useful output', () => {
        expect(stepOutputPlaceholders('dhis2-analytics-run')).toEqual([])
        expect(stepOutputPlaceholders(undefined)).toEqual([])
    })
})
