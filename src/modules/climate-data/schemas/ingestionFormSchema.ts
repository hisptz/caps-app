import i18n from '@dhis2/d2-i18n'
import { z } from 'zod'
import { FUTURE_TEMPORAL_DIRECTION } from '@/modules/climate-data/utils/template'

export const ingestionFormSchema = z
    .object({
        dataset_id: z
            .string()
            .min(1, { message: i18n.t('Select a dataset template') }),
        periodIds: z.array(
            z.string().min(1, { message: i18n.t('Select a period') })
        ),
        overwrite: z.boolean(),
        publish: z.boolean(),
        temporalDirection: z.string().optional(),
    })
    .superRefine((values, ctx) => {
        if (values.temporalDirection === FUTURE_TEMPORAL_DIRECTION) {
            return
        }
        if (values.periodIds.length < 1) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: i18n.t('Select at least one period'),
                path: ['periodIds'],
            })
        }
    })

export type IngestionFormValues = z.infer<typeof ingestionFormSchema>

export const defaultIngestionFormValues: IngestionFormValues = {
    dataset_id: '',
    periodIds: [],
    overwrite: false,
    publish: true,
    temporalDirection: undefined,
}
