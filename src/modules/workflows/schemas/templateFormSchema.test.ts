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
                'diseaseItems',
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

    it('keeps the source ID when no staging data element is given', () => {
        const params = templateFormValuesToParams(
            values({
                diseaseSource: 'instance',
                routeCode: 'caps-src-hmis',
                diseaseItems: [
                    { from: 'CasesDataE1', fromType: 'DATA_ELEMENT', into: '' },
                    {
                        from: 'IndicatorA1',
                        fromType: 'INDICATOR',
                        into: 'IntoDataEl1',
                    },
                ],
                predictionSetupId: '7',
                notifyGroups: ['ModellersGr'],
            })
        )
        expect(params.disease).toEqual({
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
        })
        expect(params.prediction).toEqual({
            predictionSetupId: 7,
            periodsAhead: 3,
            notify: { users: [], userGroups: ['ModellersGr'] },
        })
    })

    it('round-trips through the saved parameters', () => {
        const original = values({
            diseaseSource: 'instance',
            routeCode: 'caps-src-hmis',
            diseaseItems: [
                { from: 'CasesDataE1', fromType: 'DATA_ELEMENT', into: '' },
            ],
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
        expect(field('disease.items.0')).toBe('diseaseItems.0.from')
        expect(field('disease.routeCode')).toBe('routeCode')
        expect(field('prediction.predictionSetupId')).toBe('predictionSetupId')
        expect(field('periodType')).toBe('periodType')
        expect(field('')).toBeNull()
    })
})
