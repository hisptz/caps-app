import { useDataEngine } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import { SingleSelectField, SingleSelectOption } from '@dhis2/ui'
import React from 'react'
import { useController } from 'react-hook-form'
import { useModelsQuery } from '@/shared/hooks/useModelsQuery'
import type { ConfiguredModel } from '@/shared/types/caps'

export function ModelSelector() {
    const engine = useDataEngine()
    const { field, fieldState } = useController({
        name: `handlerConfig.modelId`,
    })

    const {
        data: modelsData,
        isError: modelsError,
        isLoading: modelsLoading,
    } = useModelsQuery(engine)

    const models: ConfiguredModel[] = modelsData?.models ?? []
    const hasModelError = modelsData?.error || modelsError

    return (
        <SingleSelectField
            label={i18n.t('Model')}
            required
            error={!!hasModelError || !!fieldState.error}
            validationText={fieldState.error?.message}
            loading={modelsLoading}
            selected={models.find(({ name }) => name === field.value)?.name}
            onChange={({ selected }: { selected: string }) =>
                field.onChange(selected)
            }
        >
            {models.map((m) => (
                <SingleSelectOption
                    key={m.name}
                    value={m.name}
                    label={m.displayName}
                />
            ))}
        </SingleSelectField>
    )
}
