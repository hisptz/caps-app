import i18n from '@dhis2/d2-i18n'
import React, { useEffect, useMemo } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import {
    defaultDhis2DataUploadConfig,
    isDhis2DataUploadConfig,
    type DataValueImportStrategy,
} from '@/modules/dhis2-data-upload/schemas/config'
import type { PipelineStepFormWithHandlerValues } from '@/modules/pipeline-detail/schemas/stepFormSchema'
import {
    FormSection,
    RadioCardGroup,
    type RadioCardOption,
} from '@/shared/components/ui/FormPrimitives'

export interface Dhis2DataUploadConfigProps {
    value: Record<string, unknown> | null
    onChange: (v: Record<string, unknown>) => void
}

const IMPORT_STRATEGY_OPTIONS: ReadonlyArray<
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

export function Dhis2DataUploadConfig({
    value,
    onChange,
}: Dhis2DataUploadConfigProps): React.ReactElement {
    const { control, getValues, setValue } =
        useFormContext<PipelineStepFormWithHandlerValues>()

    const defaults = useMemo(() => defaultDhis2DataUploadConfig(), [])

    useEffect(() => {
        const raw = getValues('handlerConfig') ?? value
        if (!isDhis2DataUploadConfig(raw)) {
            const next = { ...(raw ?? {}), ...defaults }
            setValue('handlerConfig', next, { shouldDirty: false })
            onChange(next)
        }
    }, [defaults, getValues, onChange, setValue, value])

    return (
        <FormSection
            title={i18n.t('Import strategy')}
            description={i18n.t(
                'How DHIS2 should treat values that already exist when importing the data value set.'
            )}
            tight
        >
            <Controller
                name="handlerConfig.importStrategy"
                control={control}
                render={({ field }) => (
                    <RadioCardGroup<DataValueImportStrategy>
                        name="dhis2-data-upload-import-strategy"
                        value={
                            (field.value as DataValueImportStrategy) ??
                            defaults.importStrategy
                        }
                        onChange={field.onChange}
                        options={IMPORT_STRATEGY_OPTIONS}
                        columns={3}
                    />
                )}
            />
        </FormSection>
    )
}
