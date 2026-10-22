import i18n from '@dhis2/d2-i18n'
import type { DataValueImportStrategy } from '@/modules/dhis2-data-upload/schemas/config'
import type { RadioCardOption } from '@/shared/components/ui/FormPrimitives'

export const IMPORT_STRATEGY_OPTIONS: ReadonlyArray<
    RadioCardOption<DataValueImportStrategy>
> = [
    {
        value: 'CREATE_AND_UPDATE',
        title: i18n.t('Merge'),
        description: i18n.t('Import new values and update existing'),
    },
    {
        value: 'CREATE',
        title: i18n.t('Append'),
        description: i18n.t('Import new values only'),
    },
    {
        value: 'UPDATE',
        title: i18n.t('Update'),
        description: i18n.t('Only update existing values, ignore new values'),
    },
]
