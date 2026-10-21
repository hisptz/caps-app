import { z } from 'zod'

export const DHIS2_NOTIFY_HANDLER = 'dhis2-notify'

/** Mirrors caps-engine `dhis2RecipientsSchema`. */
export const dhis2RecipientsSchema = z.object({
    users: z.array(z.string()).default([]),
    userGroups: z.array(z.string()).default([]),
})

export type Dhis2RecipientsValue = z.infer<typeof dhis2RecipientsSchema>

/** Mirrors caps-engine worker `dhis2NotifyConfigSchema`. */
export const dhis2NotifyConfigSchema = z.object({
    recipients: dhis2RecipientsSchema.default({ users: [], userGroups: [] }),
    subject: z
        .string()
        .min(1)
        .max(255)
        .default('CAPS: {{stepName}} — run finished'),
    message: z
        .string()
        .min(1)
        .default(
            'The CAPS pipeline run {{executionId}} reached step {{stepName}} on {{date}}.'
        ),
    failOnError: z.boolean().default(false),
})

export type Dhis2NotifyConfigValue = z.infer<typeof dhis2NotifyConfigSchema>

export function defaultDhis2NotifyConfig(): Dhis2NotifyConfigValue {
    return dhis2NotifyConfigSchema.parse({})
}

/** Strict check: the stored config must already carry subject and message. */
export function isDhis2NotifyConfig(
    value: unknown
): value is Dhis2NotifyConfigValue {
    return dhis2NotifyConfigSchema
        .extend({ subject: z.string(), message: z.string() })
        .safeParse(value).success
}
