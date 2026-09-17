import i18n from '@dhis2/d2-i18n'
import { z } from 'zod'

export const pipelineFormSchema = z.object({
    name: z.string().min(1, { message: i18n.t('Name is required') }),
    description: z.string().optional(),
    concurrencyPolicy: z.enum(['ALLOW', 'SKIP', 'REPLACE']),
    isActive: z.boolean(),
})

export type PipelineFormValues = z.infer<typeof pipelineFormSchema>

export const defaultPipelineFormValues: PipelineFormValues = {
    name: '',
    description: '',
    concurrencyPolicy: 'SKIP',
    isActive: true,
}
