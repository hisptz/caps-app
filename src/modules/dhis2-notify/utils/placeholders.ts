import i18n from '@dhis2/d2-i18n'

export type NotifyPlaceholder = {
    token: string
    label: string
    description: string
}

export function generalPlaceholders(): NotifyPlaceholder[] {
    return [
        {
            token: '{{pipelineName}}',
            label: i18n.t('Pipeline name'),
            description: i18n.t('Name of the pipeline'),
        },
        {
            token: '{{runUrl}}',
            label: i18n.t('Run link'),
            description: i18n.t('Link to this run in the CAPS app'),
        },
        {
            token: '{{date}}',
            label: i18n.t('Date'),
            description: i18n.t('Today’s date in the DHIS2 server time zone'),
        },
        {
            token: '{{stepName}}',
            label: i18n.t('Step name'),
            description: i18n.t('Name of this notify step'),
        },
    ]
}

function inputField(
    field: string,
    label: string,
    description: string
): NotifyPlaceholder {
    return { token: `{{input.${field}}}`, label, description }
}

/** Output fields of each handler in caps-engine, offered as `{{input.<field>}}`. */
export function stepOutputPlaceholders(
    handlerKey: string | undefined
): NotifyPlaceholder[] {
    switch (handlerKey) {
        case 'prediction-poll':
            return [
                inputField(
                    'status',
                    i18n.t('Job status'),
                    i18n.t('Final status of the CHAP job')
                ),
                inputField(
                    'jobId',
                    i18n.t('CHAP job ID'),
                    i18n.t('CHAP job ID')
                ),
            ]
        case 'prediction-data-download':
        case 'climate-openeo-download':
            return [
                inputField(
                    'count',
                    i18n.t('Value count'),
                    i18n.t('Number of values downloaded')
                ),
            ]
        case 'dhis2-data-upload':
            return [
                inputField(
                    'imported',
                    i18n.t('Imported'),
                    i18n.t('Values newly imported into DHIS2')
                ),
                inputField(
                    'updated',
                    i18n.t('Updated'),
                    i18n.t('Existing values that were updated')
                ),
                inputField(
                    'ignored',
                    i18n.t('Ignored'),
                    i18n.t('Values DHIS2 ignored')
                ),
                inputField(
                    'status',
                    i18n.t('Import status'),
                    i18n.t('DHIS2 import status, e.g. SUCCESS or WARNING')
                ),
            ]
        case 'alert-generation':
            return [
                inputField(
                    'count',
                    i18n.t('Alert count'),
                    i18n.t('Number of alerts generated')
                ),
            ]
        case 'event-data-upload':
            return [
                inputField(
                    'created',
                    i18n.t('Created'),
                    i18n.t('Alert events created in DHIS2')
                ),
                inputField(
                    'updated',
                    i18n.t('Updated'),
                    i18n.t('Alert events updated in DHIS2')
                ),
            ]
        default:
            return []
    }
}
