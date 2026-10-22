import {
    dhis2RecipientsSchema,
    type Dhis2RecipientsValue,
} from '@/modules/dhis2-notify/schemas/config'

type PipelineConfig = Record<string, unknown> | null | undefined

function readNotifications(config: PipelineConfig): Record<string, unknown> {
    const raw = config?.notifications
    return raw && typeof raw === 'object'
        ? (raw as Record<string, unknown>)
        : {}
}

/** Users and user groups messaged when a run fails (`config.notifications.onFailure`). */
export function readFailureRecipients(
    config: PipelineConfig
): Dhis2RecipientsValue {
    const parsed = dhis2RecipientsSchema.safeParse(
        readNotifications(config).onFailure ?? {}
    )
    return parsed.success ? parsed.data : { users: [], userGroups: [] }
}

/** Returns the pipeline config with the failure recipients replaced; other keys are kept. */
export function withFailureRecipients(
    config: PipelineConfig,
    recipients: Dhis2RecipientsValue
): Record<string, unknown> {
    const notifications = { ...readNotifications(config) }
    delete notifications.onFailure
    const hasAny = recipients.users.length + recipients.userGroups.length > 0

    return {
        ...(config ?? {}),
        notifications: {
            ...notifications,
            ...(hasAny ? { onFailure: recipients } : {}),
        },
    }
}
