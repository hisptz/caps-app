import { useDataEngine } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import { useQuery } from '@tanstack/react-query'
import React, { useEffect, useMemo } from 'react'
import { useController, useWatch } from 'react-hook-form'
import { metadataOption } from './MetadataOption'
import { SearchableSimpleSelectField } from '@/shared/components/ui/FormPrimitives'

type DataElementCombo = {
    categoryCombo?: {
        isDefault?: boolean
        categoryOptionCombos?: Array<{ id: string; displayName: string }>
    }
}

/**
 * One of the disaggregations of the data element at `dataElementName`. Empty means the
 * default; a data element without disaggregations has nothing else to pick.
 */
export function CategoryOptionComboSelector({
    name,
    dataElementName,
    label,
    dense,
}: {
    name: string
    dataElementName: string
    label: string
    dense?: boolean
}): React.ReactElement {
    const engine = useDataEngine()
    const { field, fieldState } = useController({ name })
    const dataElementId = useWatch({ name: dataElementName }) as
        | string
        | undefined

    const combo = useQuery({
        queryKey: ['dhis2', 'coc-selector', dataElementId],
        enabled: Boolean(dataElementId),
        staleTime: 60_000,
        queryFn: async () => {
            const result = (await engine.query({
                dataElement: {
                    resource: 'dataElements',
                    id: dataElementId!,
                    params: {
                        fields: 'categoryCombo[isDefault,categoryOptionCombos[id,displayName]]',
                    },
                },
            })) as { dataElement: DataElementCombo }
            return result.dataElement.categoryCombo
        },
    })

    const options = useMemo(
        () =>
            combo.data?.isDefault
                ? []
                : (combo.data?.categoryOptionCombos ?? []).map((item) => ({
                      value: item.id,
                      label: item.displayName,
                      component: metadataOption(),
                  })),
        [combo.data]
    )
    const value = typeof field.value === 'string' ? field.value : ''
    const loaded = !value || options.some((option) => option.value === value)

    // A combo of the data element chosen before is not one of this one's.
    useEffect(() => {
        if (combo.isSuccess && !combo.isFetching && value && !loaded) {
            field.onChange('')
        }
    }, [combo.isSuccess, combo.isFetching, value, loaded, field])

    return (
        <SearchableSimpleSelectField
            name={name}
            label={label}
            dense={dense}
            value={loaded ? value || undefined : undefined}
            onChange={(next: string) => field.onChange(next || '')}
            options={options}
            placeholder={i18n.t('Default')}
            clearable
            clearText={i18n.t('Clear')}
            noMatchText={i18n.t('No matching disaggregations')}
            disabled={
                !dataElementId || (combo.isSuccess && options.length === 0)
            }
            loading={combo.isFetching}
            error={Boolean(fieldState.error)}
            validationText={fieldState.error?.message}
        />
    )
}
