import type { ClimateCollection } from '@/capsApi/types'
import type { TemplateFormValues } from '@/modules/workflows/schemas/templateFormSchema'
import type { CovariateSource } from '@/shared/types/caps'

type ClimateRow = TemplateFormValues['climate'][number]

/** CHAP's name for the disease counts a model predicts; they come from DHIS2, not OCS. */
export const DISEASE_COVARIATE = 'disease_cases'

const PERIOD_LENGTH: Record<string, number> = {
    daily: 1,
    weekly: 7,
    monthly: 30,
}

/** Covariate words and the dataset words that usually serve them. */
const DATASET_HINTS: Array<[RegExp, RegExp]> = [
    [/rain|precip/, /precip|rain|chirps/],
    [/temp/, /temp|t2m/],
    [/humid/, /humid/],
    [/ndvi|vegetation/, /ndvi|vegetation/],
]

const isEmptyRow = (row: ClimateRow) => !row.datasetId && !row.dataElement

/**
 * The one Open Climate Service dataset a covariate's name points to, e.g. "rainfall" →
 * "CHIRPS Precipitation", among datasets that can give the workflow's period type. Empty
 * when none or several fit, so the user chooses.
 */
export function guessDataset(
    covariate: string,
    datasets: ClimateCollection[],
    periodType: TemplateFormValues['periodType']
): string {
    const name = covariate.toLowerCase()
    const hint = DATASET_HINTS.find(([words]) => words.test(name))?.[1]
    if (!hint) {
        return ''
    }
    const wanted = PERIOD_LENGTH[periodType.toLowerCase()]!
    const fitting = datasets.filter((d) => {
        const length = d.periodType ? PERIOD_LENGTH[d.periodType] : undefined
        const text = `${d.id} ${d.title} ${d.variable ?? ''}`.toLowerCase()
        return length !== undefined && length <= wanted && hint.test(text)
    })
    return fitting.length === 1 ? fitting[0]!.id : ''
}

/** Rainfall adds up over a period; temperature and the like are averaged. */
function aggregationFor(covariate: string): ClimateRow['aggregation'] {
    return /rain|precip/.test(covariate.toLowerCase()) ? 'sum' : 'mean'
}

/**
 * Climate rows for the setup's inputs that do not come from DHIS2: what the user already
 * filled stays, empty rows go, and each other input gets a row writing into its data element.
 */
export function climateRowsFromSetup(
    rows: ClimateRow[],
    sources: CovariateSource[],
    {
        datasets,
        periodType,
        pulled,
    }: {
        datasets: ClimateCollection[]
        periodType: TemplateFormValues['periodType']
        /** Staging data elements the chosen instance pulls */
        pulled: Set<string>
    }
): ClimateRow[] {
    const kept = rows.filter((row) => !isEmptyRow(row))
    const present = new Set(kept.map((row) => row.dataElement))
    const added = sources
        .filter(
            (s) =>
                s.covariate !== DISEASE_COVARIATE &&
                !pulled.has(s.dataElementId) &&
                !present.has(s.dataElementId)
        )
        .map((s) => ({
            datasetId: guessDataset(s.covariate, datasets, periodType),
            dataElement: s.dataElementId,
            aggregation: aggregationFor(s.covariate),
        }))
    return [...kept, ...added]
}

/** The setup's inputs this instance pulls, added to what is already picked. */
export function pulledFromSetup(
    mapped: string[],
    sources: CovariateSource[],
    pulled: Set<string>
): string[] {
    const wanted = sources
        .map((s) => s.dataElementId)
        .filter((id) => pulled.has(id) && !mapped.includes(id))
    return [...mapped, ...wanted]
}

/** Rows the user left without a dataset that the instance now pulls instead. */
export function dropPulledRows(
    rows: ClimateRow[],
    pulled: Set<string>
): ClimateRow[] {
    return rows.filter((row) => row.datasetId || !pulled.has(row.dataElement))
}
