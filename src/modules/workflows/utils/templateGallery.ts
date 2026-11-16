import i18n from '@dhis2/d2-i18n'
import type { TemplateFormValues } from '@/modules/workflows/schemas/templateFormSchema'

/** The engine's one template; the gallery offers parts of it. */
export const CLIMATE_PREDICTION_TEMPLATE = 'climate-prediction'

/** Parts of the template form; a gallery entry shows only the ones it needs. */
export type TemplateFormSection =
    | 'prediction'
    | 'orgUnits'
    | 'climate'
    | 'disease'
    | 'options'
    | 'backfill'

export type TemplateGalleryEntry = {
    /** Kept in the URL as ?preset= */
    id: 'instance-pull' | 'climate-analytics' | 'prediction' | 'full'
    title: string
    /** Optional lead-in shown above the title, e.g. "Full workflow" */
    eyebrow?: string
    description: string
    /** What it makes, e.g. "1 pipeline · scheduled" */
    shape: string
    /** Engine template it creates; null = the engine cannot make it yet */
    template: string | null
    sections: TemplateFormSection[]
    /** Form values the preset starts from, over the template's defaults */
    defaults: Partial<TemplateFormValues>
}

export const ALL_TEMPLATE_SECTIONS: TemplateFormSection[] = [
    'prediction',
    'orgUnits',
    'climate',
    'disease',
    'options',
    'backfill',
]

export function templateGallery(): TemplateGalleryEntry[] {
    return [
        {
            id: 'instance-pull',
            title: i18n.t('Pull data from a connected instance'),
            description: i18n.t(
                'Copies the data elements you choose from another DHIS2 instance, such as the HMIS, into staging on a schedule, then runs analytics.'
            ),
            shape: i18n.t('1 pipeline · scheduled'),
            template: CLIMATE_PREDICTION_TEMPLATE,
            sections: ['orgUnits', 'disease', 'options', 'backfill'],
            defaults: { climate: [], diseaseSource: 'instance' },
        },
        {
            id: 'climate-analytics',
            title: i18n.t('Fetch climate data and run analytics'),
            description: i18n.t(
                'Fetches climate variables such as rainfall and temperature for your org units from Open Climate Service, saves them in staging and runs analytics.'
            ),
            shape: i18n.t('1 pipeline · scheduled'),
            template: CLIMATE_PREDICTION_TEMPLATE,
            sections: ['orgUnits', 'climate', 'options', 'backfill'],
            defaults: {},
        },
        {
            id: 'prediction',
            title: i18n.t('Run a prediction'),
            description: i18n.t(
                'Runs a CHAP prediction setup on the data already in staging and tells the modeller when it is ready.'
            ),
            shape: i18n.t('1 pipeline · needs a prediction setup'),
            template: CLIMATE_PREDICTION_TEMPLATE,
            sections: ['prediction', 'options'],
            defaults: { climate: [], setupRequired: true },
        },
        {
            id: 'full',
            eyebrow: i18n.t('Full workflow'),
            title: i18n.t('Climate and disease data, then prediction'),
            description: i18n.t(
                'Everything in one workflow: climate data and disease data on the same schedule, then analytics and a prediction once both are in.'
            ),
            shape: i18n.t('2 or 3 pipelines · scheduled'),
            template: CLIMATE_PREDICTION_TEMPLATE,
            sections: ALL_TEMPLATE_SECTIONS,
            defaults: {},
        },
    ]
}

/**
 * The gallery entry a new-workflow form was opened from. Without one (an older link, or
 * editing a workflow's setup) the whole form shows.
 */
export function galleryEntryFor(
    template: string | undefined,
    presetId: string | null
): TemplateGalleryEntry | undefined {
    const entries = templateGallery()
    const preset = presetId
        ? entries.find((e) => e.id === presetId && e.template === template)
        : undefined
    return (
        preset ??
        entries.find((e) => e.id === 'full' && e.template === template)
    )
}
