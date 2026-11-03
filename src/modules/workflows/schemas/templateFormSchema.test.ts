import {
    defaultTemplateFormValues,
    formFieldForIssue,
    paramsToTemplateFormValues,
    templateFormSchema,
    templateFormValuesToBackfill,
    templateFormValuesToParams,
    type TemplateFormValues,
} from './templateFormSchema'

function values(
    overrides: Partial<TemplateFormValues> = {}
): TemplateFormValues {
    return {
        ...defaultTemplateFormValues(),
        name: ' Malawi ',
        orgUnitLevel: '3',
        climate: [
            {
                datasetId: 'era5land_precipitation_monthly',
                dataElement: 'RainDataEl1',
                aggregation: 'sum',
            },
        ],
        ...overrides,
    }
}

describe('templateFormSchema', () => {
    it('needs org units unless a prediction setup gives them', () => {
        expect(
            templateFormSchema.safeParse(values({ orgUnitLevel: '' })).success
        ).toBe(false)
        expect(
            templateFormSchema.safeParse(
                values({ orgUnitLevel: '', predictionSetupId: '7' })
            ).success
        ).toBe(true)
    })

    it('needs an instance and what to pull when disease data is pulled', () => {
        const result = templateFormSchema.safeParse(
            values({ diseaseSource: 'instance' })
        )
        expect(result.success).toBe(false)
        if (!result.success) {
            expect(result.error.issues.map((i) => i.path.join('.'))).toEqual([
                'routeCode',
                'diseaseMapped',
            ])
        }
    })

    it('needs both ends of a backfill', () => {
        const result = templateFormSchema.safeParse(
            values({ backfill: true, backfillStart: '2020W1' })
        )
        expect(result.success).toBe(false)
    })
})

describe('templateFormValuesToParams', () => {
    it('builds the engine parameters, leaving out what is not chosen', () => {
        expect(templateFormValuesToParams(values())).toEqual({
            name: 'Malawi',
            description: undefined,
            cronExpr: '0 6 * * 1',
            periodType: 'WEEKLY',
            orgUnit: { level: 3, ids: [] },
            recentPeriods: 4,
            climate: values().climate,
            disease: { source: 'staging' },
            prediction: null,
        })
    })

    it('pulls the picked mapped data elements', () => {
        const params = templateFormValuesToParams(
            values({
                diseaseSource: 'instance',
                routeCode: 'caps-src-hmis',
                diseaseMapped: ['CasesDataE1', 'IntoDataEl1'],
                predictionSetupId: '7',
                notifyGroups: ['ModellersGr'],
            })
        )
        expect(params.disease).toEqual({
            source: 'instance',
            routeCode: 'caps-src-hmis',
            mapped: ['CasesDataE1', 'IntoDataEl1'],
        })
        expect(params.prediction).toEqual({
            predictionSetupId: 7,
            periodsAhead: 3,
            notify: { users: [], userGroups: ['ModellersGr'] },
        })
    })

    it('reopens an older workflow’s items as the staging data elements they fill', () => {
        const reopened = paramsToTemplateFormValues({
            ...templateFormValuesToParams(values()),
            disease: {
                source: 'instance',
                routeCode: 'caps-src-hmis',
                items: [
                    { from: 'CasesDataE1', fromType: 'DATA_ELEMENT' },
                    {
                        from: 'IndicatorA1',
                        fromType: 'INDICATOR',
                        into: 'IntoDataEl1',
                    },
                ],
            },
        })
        expect(reopened.diseaseMapped).toEqual(['CasesDataE1', 'IntoDataEl1'])
    })

    it('round-trips through the saved parameters', () => {
        const original = values({
            diseaseSource: 'instance',
            routeCode: 'caps-src-hmis',
            diseaseMapped: ['CasesDataE1'],
            predictionSetupId: '7',
            scheduled: false,
        })
        const reopened = paramsToTemplateFormValues(
            templateFormValuesToParams(original)
        )
        expect(reopened).toEqual({ ...original, name: 'Malawi' })
    })

    it('backfills only when asked, in the workflow period type', () => {
        expect(templateFormValuesToBackfill(values())).toBeUndefined()
        expect(
            templateFormValuesToBackfill(
                values({
                    backfill: true,
                    periodType: 'MONTHLY',
                    backfillStart: '202001',
                    backfillEnd: '202609',
                })
            )
        ).toEqual({ periodType: 'MONTHLY', start: '202001', end: '202609' })
    })
})

describe('formFieldForIssue', () => {
    it('points engine issues at the form field they are about', () => {
        const field = (path: string) => formFieldForIssue({ path, message: '' })
        expect(field('climate.1.datasetId')).toBe('climate.1.datasetId')
        expect(field('disease.mapped')).toBe('diseaseMapped')
        expect(field('disease.items.0')).toBe('diseaseMapped')
        expect(field('disease.routeCode')).toBe('routeCode')
        expect(field('prediction.predictionSetupId')).toBe('predictionSetupId')
        expect(field('periodType')).toBe('periodType')
        expect(field('')).toBeNull()
    })
})
