import { z } from 'zod'

/** Mirrors caps-engine worker `dataValueImportStrategySchema`. */
export const dataValueImportStrategySchema = z.enum([
    'CREATE_AND_UPDATE',
    'CREATE',
    'UPDATE',
])

export type DataValueImportStrategy = z.infer<
    typeof dataValueImportStrategySchema
>

/** Mirrors caps-engine worker `dhis2DataUploadConfigSchema`. */
export const dhis2DataUploadConfigSchema = z.object({
    importStrategy: dataValueImportStrategySchema.default('CREATE_AND_UPDATE'),
})

export type Dhis2DataUploadConfigValue = z.infer<
    typeof dhis2DataUploadConfigSchema
>

export function defaultDhis2DataUploadConfig(): Dhis2DataUploadConfigValue {
    return dhis2DataUploadConfigSchema.parse({})
}

/** Strict check: the stored config must already carry an explicit strategy. */
export function isDhis2DataUploadConfig(
    value: unknown
): value is Dhis2DataUploadConfigValue {
    return dhis2DataUploadConfigSchema
        .extend({ importStrategy: dataValueImportStrategySchema })
        .safeParse(value).success
}
