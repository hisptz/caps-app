import type { StacCollection } from '@/capsApi/types'
import { toClimateCollection } from '@/modules/climate-data/utils/stacCollection'

const chirps: StacCollection = {
    type: 'Collection',
    id: 'chirps3_precipitation_daily',
    title: 'Precipitation rate (CHIRPS3)',
    description: 'Daily rainfall over land at 5 km.',
    license: 'CC-BY-4.0',
    extent: {
        spatial: { bbox: [[-13.5, 6.9, -10.1, 10.0]] },
        temporal: {
            interval: [['2025-10-06T00:00:00Z', '2026-08-31T00:00:00Z']],
        },
    },
    'cube:dimensions': {
        t: {
            type: 'temporal',
            extent: ['2025-10-06T00:00:00Z', '2026-08-31T00:00:00Z'],
            step: 'P1D',
        },
        x: { type: 'spatial', step: 0.05 },
    },
    'cube:variables': {
        precip: {
            type: 'data',
            unit: 'mm/d',
            'cf:standard_name': 'lwe_precipitation_rate',
        },
    },
    providers: [{ name: 'UCSB Climate Hazards Center' }],
    assets: {
        zarr: {
            href: 'http://ocs.example/zarr/chirps3_precipitation_daily',
            title: 'Zarr store',
            type: 'application/vnd.zarr; version=3',
        },
    },
    renders: { default: { 'open_climate_service:variable': 'precip' } },
}

describe('toClimateCollection', () => {
    it('flattens a published STAC collection', () => {
        expect(toClimateCollection(chirps)).toEqual({
            id: 'chirps3_precipitation_daily',
            title: 'Precipitation rate (CHIRPS3)',
            description: 'Daily rainfall over land at 5 km.',
            variable: 'precip',
            units: 'mm/d',
            variables: [
                {
                    name: 'precip',
                    unit: 'mm/d',
                    standardName: 'lwe_precipitation_rate',
                },
            ],
            periodType: 'daily',
            extent: {
                temporal: { start: '2025-10-06', end: '2026-08-31' },
                bbox: [-13.5, 6.9, -10.1, 10.0],
            },
            providers: [{ name: 'UCSB Climate Hazards Center' }],
            license: 'CC-BY-4.0',
            assets: [
                {
                    key: 'zarr',
                    href: 'http://ocs.example/zarr/chirps3_precipitation_daily',
                    title: 'Zarr store',
                    type: 'application/vnd.zarr; version=3',
                },
            ],
        })
    })

    it.each([
        ['P1M', 'monthly'],
        ['P7D', 'weekly'],
        ['P1W', 'weekly'],
        ['P1Y', 'yearly'],
    ])('maps step %s to %s', (step, periodType) => {
        const collection = {
            ...chirps,
            'cube:dimensions': { t: { type: 'temporal', step } },
        }
        expect(toClimateCollection(collection).periodType).toBe(periodType)
    })

    it('treats a temporal dimension without a step as irregular', () => {
        const collection = {
            ...chirps,
            'cube:dimensions': { t: { type: 'temporal', step: null } },
        }
        expect(toClimateCollection(collection).periodType).toBe('irregular')
    })

    it('prefers the rendered variable over the first one', () => {
        const collection: StacCollection = {
            ...chirps,
            'cube:variables': {
                spatial_ref: { type: 'auxiliary' },
                tmin: { type: 'data', unit: 'K' },
                t2m: { type: 'data', unit: 'K' },
            },
            renders: { default: { 'open_climate_service:variable': 't2m' } },
        }
        const result = toClimateCollection(collection)
        expect(result.variable).toBe('t2m')
        expect(result.variables.map((v) => v.name)).toEqual(['tmin', 't2m'])
    })

    it('falls back to the id and the cube extent when fields are missing', () => {
        const result = toClimateCollection({
            type: 'Collection',
            id: 'bare',
            'cube:dimensions': {
                t: {
                    type: 'temporal',
                    extent: ['2020-01-01T00:00:00Z', null],
                    step: 'P1D',
                },
            },
        })
        expect(result.title).toBe('bare')
        expect(result.extent.temporal).toEqual({
            start: '2020-01-01',
            end: null,
        })
        expect(result.variable).toBeUndefined()
        expect(result.assets).toEqual([])
    })
})
