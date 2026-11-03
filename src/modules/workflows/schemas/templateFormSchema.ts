import i18n from '@dhis2/d2-i18n'
import { z } from 'zod'
import { splitCronExpression } from '@/modules/pipeline-detail/utils/cronHelpers'
import type {
    ClimatePredictionParams,
    RunPeriodRange,
    TemplateIssue,
} from '@/shared/types/caps'

/**
 * Form for the Climate → Prediction template. The form only checks what it can see; the
 * engine's preview checks the rest (CHAP setup, staging data elements, OCS datasets, route).
 */
const climateRowSchema = z.object({
    datasetId: z.string().min(1, i18n.t('Choose a dataset')),
    dataElement: z.string().min(1, i18n.t('Choose a data element')),
    aggregation: z.enum(['mean', 'min', 'max', 'sum']),
})

const diseaseItemSchema = z.object({
    from: z.string().min(1, i18n.t('Choose what to pull')),
    fromType: z.enum(['DATA_ELEMENT', 'INDICATOR', 'PROGRAM_INDICATOR']),
    /** Staging data element; empty keeps the source ID (data elements only) */
    into: z.string(),
})

export const templateFormSchema = z
    .object({
        name: z.string().trim().min(1, i18n.t('Name is required')).max(200),
        description: z.string(),
        scheduled: z.boolean(),
        cronExpression: z.string(),
        periodType: z.enum(['WEEKLY', 'MONTHLY']),
        recentPeriods: z.number().int().min(1).max(104),
        /** CHAP prediction setup id as text; '' = none yet */
        predictionSetupId: z.string(),
        periodsAhead: z.number().int().min(1).max(52),
        notifyUsers: z.array(z.string()),
        notifyGroups: z.array(z.string()),
        /** '' = none; ignored when a prediction setup gives the org units */
        orgUnitLevel: z.string(),
        /** Kept from saved parameters; not edited here */
        orgUnitIds: z.array(z.string()),
        climate: z
            .array(climateRowSchema)
            .min(1, i18n.t('Add at least one climate variable')),
        diseaseSource: z.enum(['staging', 'instance']),
        routeCode: z.string(),
        diseaseItems: z.array(diseaseItemSchema),
        backfill: z.boolean(),
        backfillStart: z.string(),
        backfillEnd: z.string(),
    })
    .superRefine((values, ctx) => {
        if (
            values.scheduled &&
            !splitCronExpression(values.cronExpression).valid
        ) {
            ctx.addIssue({
                code: 'custom',
                path: ['cronExpression'],
                message: i18n.t('Enter a valid cron expression'),
            })
        }
        if (values.periodType === 'MONTHLY' && values.recentPeriods > 36) {
            ctx.addIssue({
                code: 'custom',
                path: ['recentPeriods'],
                message: i18n.t('Refresh at most 36 months per run'),
            })
        }
        if (
            !values.predictionSetupId &&
            !values.orgUnitLevel &&
            values.orgUnitIds.length === 0
        ) {
            ctx.addIssue({
                code: 'custom',
                path: ['orgUnitLevel'],
                message: i18n.t(
                    'Choose an org unit level, or a prediction setup to take the org units from'
                ),
            })
        }
        if (values.diseaseSource === 'instance') {
            if (!values.routeCode) {
                ctx.addIssue({
                    code: 'custom',
                    path: ['routeCode'],
                    message: i18n.t('Choose the instance to pull from'),
                })
            }
            if (values.diseaseItems.length === 0) {
                ctx.addIssue({
                    code: 'custom',
                    path: ['diseaseItems'],
                    message: i18n.t('Add the disease data to pull'),
                })
            }
            values.diseaseItems.forEach((item, index) => {
                if (item.fromType !== 'DATA_ELEMENT' && !item.into) {
                    ctx.addIssue({
                        code: 'custom',
                        path: ['diseaseItems', index, 'into'],
                        message: i18n.t(
                            'Indicators need a staging data element to go into'
                        ),
                    })
                }
            })
        }
        if (values.backfill) {
            for (const key of ['backfillStart', 'backfillEnd'] as const) {
                if (!values[key]) {
                    ctx.addIssue({
                        code: 'custom',
                        path: [key],
                        message: i18n.t('Choose a period'),
                    })
                }
            }
        }
    })

export type TemplateFormValues = z.infer<typeof templateFormSchema>

export function defaultTemplateFormValues(): TemplateFormValues {
    return {
        name: '',
        description: '',
        scheduled: true,
        cronExpression: '0 6 * * 1',
        periodType: 'WEEKLY',
        recentPeriods: 4,
        predictionSetupId: '',
        periodsAhead: 3,
        notifyUsers: [],
        notifyGroups: [],
        orgUnitLevel: '',
        orgUnitIds: [],
        climate: [{ datasetId: '', dataElement: '', aggregation: 'mean' }],
        diseaseSource: 'staging',
        routeCode: '',
        diseaseItems: [],
        backfill: false,
        backfillStart: '',
        backfillEnd: '',
    }
}

export function templateFormValuesToParams(
    values: TemplateFormValues
): ClimatePredictionParams {
    const setupId = values.predictionSetupId
        ? Number(values.predictionSetupId)
        : null
    return {
        name: values.name.trim(),
        description: values.description.trim() || undefined,
        cronExpr: values.scheduled ? values.cronExpression.trim() : null,
        periodType: values.periodType,
        orgUnit:
            values.orgUnitLevel || values.orgUnitIds.length > 0
                ? {
                      level: values.orgUnitLevel
                          ? Number(values.orgUnitLevel)
                          : undefined,
                      ids: values.orgUnitIds,
                  }
                : undefined,
        recentPeriods: values.recentPeriods,
        climate: values.climate,
        disease:
            values.diseaseSource === 'instance'
                ? {
                      source: 'instance',
                      routeCode: values.routeCode,
                      items: values.diseaseItems.map(
                          ({ from, fromType, into }) => ({
                              from,
                              fromType,
                              ...(into ? { into } : {}),
                          })
                      ),
                  }
                : { source: 'staging' },
        prediction:
            setupId !== null
                ? {
                      predictionSetupId: setupId,
                      periodsAhead: values.periodsAhead,
                      notify: {
                          users: values.notifyUsers,
                          userGroups: values.notifyGroups,
                      },
                  }
                : null,
    }
}

export function paramsToTemplateFormValues(
    params: ClimatePredictionParams
): TemplateFormValues {
    const defaults = defaultTemplateFormValues()
    const disease = params.disease
    return {
        ...defaults,
        name: params.name,
        description: params.description ?? '',
        scheduled: Boolean(params.cronExpr),
        cronExpression: params.cronExpr ?? defaults.cronExpression,
        periodType: params.periodType,
        recentPeriods: params.recentPeriods,
        predictionSetupId: params.prediction
            ? String(params.prediction.predictionSetupId)
            : '',
        periodsAhead: params.prediction?.periodsAhead ?? defaults.periodsAhead,
        notifyUsers: params.prediction?.notify.users ?? [],
        notifyGroups: params.prediction?.notify.userGroups ?? [],
        orgUnitLevel: params.orgUnit?.level ? String(params.orgUnit.level) : '',
        orgUnitIds: params.orgUnit?.ids ?? [],
        climate: params.climate,
        diseaseSource: disease.source,
        routeCode: disease.source === 'instance' ? disease.routeCode : '',
        diseaseItems:
            disease.source === 'instance'
                ? disease.items.map((item) => ({
                      ...item,
                      into: item.into ?? '',
                  }))
                : [],
    }
}

export function templateFormValuesToBackfill(
    values: TemplateFormValues
): RunPeriodRange | undefined {
    if (!values.backfill) {
        return undefined
    }
    return {
        periodType: values.periodType,
        start: values.backfillStart,
        end: values.backfillEnd,
    }
}

const FIELD_FOR_PARAM: Array<[RegExp, (m: RegExpMatchArray) => string]> = [
    [/^climate\.(\d+)\.(datasetId|dataElement|aggregation)$/, (m) => m[0]],
    [/^disease\.items\.(\d+)/, (m) => `diseaseItems.${m[1]}.from`],
    [/^disease\.routeCode$/, () => 'routeCode'],
    [/^prediction\.predictionSetupId$/, () => 'predictionSetupId'],
    [/^prediction\.periodsAhead$/, () => 'periodsAhead'],
    [/^orgUnit/, () => 'orgUnitLevel'],
    [/^(name|periodType|recentPeriods)$/, (m) => m[0]],
    [/^cronExpr$/, () => 'cronExpression'],
]

/** The form field an engine issue is about, or null for one about the whole setup. */
export function formFieldForIssue(
    issue: TemplateIssue
): keyof TemplateFormValues | `${string}.${string}` | null {
    for (const [pattern, field] of FIELD_FOR_PARAM) {
        const match = issue.path.match(pattern)
        if (match) {
            return field(match) as keyof TemplateFormValues
        }
    }
    return null
}
