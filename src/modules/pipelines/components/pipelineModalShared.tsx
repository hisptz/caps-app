import i18n from '@dhis2/d2-i18n'
import type { PipelineFormValues } from '@/modules/pipelines/schemas/pipelineFormSchema'

export const PIPELINE_CONCURRENCY_OPTIONS: ReadonlyArray<{
    value: PipelineFormValues['concurrencyPolicy']
    title: string
    description: string
}> = [
    {
        value: 'ALLOW',
        title: i18n.t('Allow'),
        description: i18n.t('Start anyway. Runs execute in parallel.'),
    },
    {
        value: 'SKIP',
        title: i18n.t('Skip'),
        description: i18n.t('Drop the new trigger if one is already running.'),
    },
    {
        value: 'REPLACE',
        title: i18n.t('Replace'),
        description: i18n.t('Cancel the running one and start fresh.'),
    },
]
