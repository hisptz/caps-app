import {
    CLIMATE_PREDICTION_TEMPLATE,
    galleryEntryFor,
    templateGallery,
} from './templateGallery'

describe('templateGallery', () => {
    it('offers four ways to start, all made by the one engine template', () => {
        const entries = templateGallery()
        expect(entries.map((e) => e.id)).toEqual([
            'instance-pull',
            'climate-analytics',
            'prediction',
            'full',
        ])
        expect(
            entries.every((e) => e.template === CLIMATE_PREDICTION_TEMPLATE)
        ).toBe(true)
    })

    it('climate + analytics leaves out the prediction and disease parts', () => {
        const entry = galleryEntryFor(
            CLIMATE_PREDICTION_TEMPLATE,
            'climate-analytics'
        )
        expect(entry?.sections).toEqual([
            'orgUnits',
            'climate',
            'options',
            'backfill',
        ])
    })

    it('starts the pull and prediction presets without climate data', () => {
        const pull = galleryEntryFor(
            CLIMATE_PREDICTION_TEMPLATE,
            'instance-pull'
        )
        expect(pull?.defaults).toEqual({
            climate: [],
            diseaseSource: 'instance',
        })
        const prediction = galleryEntryFor(
            CLIMATE_PREDICTION_TEMPLATE,
            'prediction'
        )
        expect(prediction?.defaults).toEqual({
            climate: [],
            setupRequired: true,
        })
        expect(prediction?.sections).toEqual(['prediction', 'options'])
    })

    it('falls back to the full form for an unknown or missing preset', () => {
        expect(galleryEntryFor(CLIMATE_PREDICTION_TEMPLATE, null)?.id).toBe(
            'full'
        )
        expect(
            galleryEntryFor(CLIMATE_PREDICTION_TEMPLATE, 'no-such-preset')?.id
        ).toBe('full')
        expect(galleryEntryFor('other-template', 'full')).toBeUndefined()
    })
})
