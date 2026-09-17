import { ingestionFormSchema } from '@/modules/climate-data/schemas/ingestionFormSchema'

describe('ingestionFormSchema', () => {
    it('requires periods for historical templates', () => {
        const result = ingestionFormSchema.safeParse({
            dataset_id: 'chirps_daily',
            periodIds: [],
            overwrite: false,
            publish: true,
        })
        expect(result.success).toBe(false)
        if (!result.success) {
            expect(
                result.error.issues.some(
                    (issue) => issue.path[0] === 'periodIds'
                )
            ).toBe(true)
        }
    })

    it('allows omitting periods for future templates', () => {
        const result = ingestionFormSchema.safeParse({
            dataset_id: 'forecast_template',
            periodIds: [],
            overwrite: false,
            publish: true,
            temporalDirection: 'future',
        })
        expect(result.success).toBe(true)
    })

    it('still accepts periods for historical templates', () => {
        const result = ingestionFormSchema.safeParse({
            dataset_id: 'chirps_daily',
            periodIds: ['202401'],
            overwrite: false,
            publish: true,
        })
        expect(result.success).toBe(true)
    })
})
