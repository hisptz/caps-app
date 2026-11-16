import {
    climateRowsFromSetup,
    dropPulledRows,
    guessDataset,
    pulledFromSetup,
} from './setupAutofill'
import type { ClimateCollection } from '@/capsApi/types'

const dataset = (
    id: string,
    title: string,
    periodType: string
): ClimateCollection => ({
    id,
    title,
    periodType,
    variables: [],
    extent: { temporal: { start: '2000-01-01', end: '2026-10-31' } },
    providers: [],
})

const datasets = [
    dataset('chirps.precip', 'CHIRPS Precipitation', 'daily'),
    dataset('era5.t2m', 'ERA5 2m temperature', 'monthly'),
]

const sources = [
    { covariate: 'rainfall', dataElementId: 'RainDataEl1' },
    { covariate: 'mean_temperature', dataElementId: 'TempDataEl1' },
    { covariate: 'disease_cases', dataElementId: 'CasesDataE1' },
]

describe('guessDataset', () => {
    it('finds the one dataset a covariate name points to', () => {
        expect(guessDataset('rainfall', datasets, 'WEEKLY')).toBe(
            'chirps.precip'
        )
    })

    it('skips a dataset too coarse for the workflow', () => {
        expect(guessDataset('mean_temperature', datasets, 'WEEKLY')).toBe('')
        expect(guessDataset('mean_temperature', datasets, 'MONTHLY')).toBe(
            'era5.t2m'
        )
    })

    it('leaves it to the user when several fit or none is hinted', () => {
        const two = [
            ...datasets,
            dataset('era5.precip', 'ERA5 precipitation', 'daily'),
        ]
        expect(guessDataset('rainfall', two, 'WEEKLY')).toBe('')
        expect(guessDataset('population', datasets, 'WEEKLY')).toBe('')
    })
})

describe('climateRowsFromSetup', () => {
    it('adds a row per climate input, leaving out disease cases and pulled data', () => {
        const rows = climateRowsFromSetup(
            [{ datasetId: '', dataElement: '', aggregation: 'mean' }],
            sources,
            { datasets, periodType: 'MONTHLY', pulled: new Set() }
        )
        expect(rows).toEqual([
            {
                datasetId: 'chirps.precip',
                dataElement: 'RainDataEl1',
                aggregation: 'sum',
            },
            {
                datasetId: 'era5.t2m',
                dataElement: 'TempDataEl1',
                aggregation: 'mean',
            },
        ])
    })

    it('keeps what the user filled and does not add it twice', () => {
        const mine = {
            datasetId: 'my.rain',
            dataElement: 'RainDataEl1',
            aggregation: 'max' as const,
        }
        const rows = climateRowsFromSetup([mine], sources, {
            datasets,
            periodType: 'WEEKLY',
            pulled: new Set(['TempDataEl1']),
        })
        expect(rows).toEqual([mine])
    })
})

describe('pulledFromSetup', () => {
    it('picks the inputs the instance pulls, keeping earlier picks', () => {
        expect(
            pulledFromSetup(
                ['OtherDataE1'],
                sources,
                new Set(['CasesDataE1', 'OtherDataE1'])
            )
        ).toEqual(['OtherDataE1', 'CasesDataE1'])
    })
})

describe('dropPulledRows', () => {
    it('drops rows without a dataset whose data element is pulled instead', () => {
        const rows = [
            { datasetId: '', dataElement: 'CasesDataE1', aggregation: 'mean' },
            { datasetId: 'x', dataElement: 'TempDataEl1', aggregation: 'mean' },
        ] as const
        expect(
            dropPulledRows([...rows], new Set(['CasesDataE1', 'TempDataEl1']))
        ).toEqual([rows[1]])
    })
})
