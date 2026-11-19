import {
    argumentProblems,
    fromOcsPipeline,
    ocsPipelineFormSchema,
    parameterKind,
    toOcsPipelineBody,
} from './ocsPipelineFormSchema'
import type { OcsPipeline, OcsWorkflowParameterOption } from '@/capsApi/types'

// aggregate_by_features as OCS declares it, without its interval parameter
const parameters: OcsWorkflowParameterOption[] = [
    {
        name: 'dataset_id',
        schema: { type: 'string', subtype: 'collection-id' },
        required: true,
    },
    {
        name: 'geometries',
        schema: { type: 'object', subtype: 'geojson' },
        required: true,
    },
    {
        name: 'method',
        schema: { type: 'string', enum: ['mean', 'sum'] },
        default: 'mean',
        required: false,
    },
]

const values = {
    id: 'chirps-precip-district',
    name: 'CHIRPS by district',
    workflowId: 'aggregate_by_features',
    arguments: {
        dataset_id: 'chirps3_precipitation_daily',
        geometries: 'districts',
        method: '',
    },
    connection: 'malawi',
    dataSet: '',
    series: [{ dataElement: 'abcdefghijk', categoryOptionCombo: '' }],
}

describe('ocsPipelineFormSchema', () => {
    it('reads each parameter kind from its schema', () => {
        expect(parameters.map(parameterKind)).toEqual([
            'dataset',
            'features',
            'enum',
        ])
        expect(
            parameterKind({
                name: 'n',
                schema: { type: 'integer' },
                required: true,
            })
        ).toBe('number')
    })

    it('builds the OCS spec: a collection bound with from_features, empty optionals left out', () => {
        expect(toOcsPipelineBody(values, parameters)).toEqual({
            id: 'chirps-precip-district',
            name: 'CHIRPS by district',
            workflow: {
                id: 'aggregate_by_features',
                arguments: {
                    dataset_id: 'chirps3_precipitation_daily',
                    geometries: { from_features: 'districts' },
                },
            },
            destination: {
                plugin: 'dhis2',
                settings: {
                    connection: 'malawi',
                    series: [{ data_element: 'abcdefghijk' }],
                },
            },
        })
    })

    it('reads a stored pipeline back into the form', () => {
        const body = toOcsPipelineBody(
            {
                ...values,
                dataSet: 'BfMAe6Itzgt',
                series: [
                    {
                        dataElement: 'abcdefghijk',
                        categoryOptionCombo: 'HllvX50cXC0',
                    },
                ],
            },
            parameters
        )
        const pipeline = {
            spec: { ...body, delivery: { mode: 'dry_run', policy: 'manual' } },
        } as unknown as OcsPipeline

        expect(fromOcsPipeline(pipeline)).toEqual({
            ...values,
            arguments: {
                dataset_id: 'chirps3_precipitation_daily',
                geometries: 'districts',
            },
            dataSet: 'BfMAe6Itzgt',
            series: [
                {
                    dataElement: 'abcdefghijk',
                    categoryOptionCombo: 'HllvX50cXC0',
                },
            ],
        })
    })

    it('flags missing required arguments and bad numbers', () => {
        expect(
            argumentProblems(
                [
                    ...parameters,
                    {
                        name: 'threshold',
                        schema: { type: 'number' },
                        required: false,
                    },
                ],
                { dataset_id: '', geometries: 'districts', threshold: 'abc' }
            )
        ).toEqual({ dataset_id: 'Required', threshold: 'Enter a number' })
    })

    it('refuses ids OCS would refuse', () => {
        expect(
            ocsPipelineFormSchema.safeParse({ ...values, id: '-bad' }).success
        ).toBe(false)
        expect(ocsPipelineFormSchema.safeParse(values).success).toBe(true)
    })
})
