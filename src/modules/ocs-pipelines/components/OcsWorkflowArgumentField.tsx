import i18n from '@dhis2/d2-i18n'
import { Field, InputField, TextAreaField } from '@dhis2/ui'
import React from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { parameterKind } from '../schemas/ocsPipelineFormSchema'
import type {
    OcsPipelineOptions,
    OcsWorkflowParameterOption,
} from '@/capsApi/types'
import { SingleSelectControl } from '@/shared/components/ui/FormPrimitives'

const AREA_TYPES = new Set(['Polygon', 'MultiPolygon'])

function hasOnlyAreas(geometryTypes: string[]): boolean {
    return geometryTypes.every((type) => AREA_TYPES.has(type))
}

function humanize(name: string): string {
    const words = name.replace(/[_-]+/g, ' ').trim()
    return words.charAt(0).toUpperCase() + words.slice(1)
}

/** One workflow parameter: a dataset, a feature collection, a choice, or a typed value. */
export function OcsWorkflowArgumentField({
    parameter,
    options,
}: {
    parameter: OcsWorkflowParameterOption
    options: OcsPipelineOptions
}): React.ReactElement {
    const { control } = useFormContext()
    const kind = parameterKind(parameter)
    const label =
        kind === 'features'
            ? i18n.t('Org unit level')
            : kind === 'dataset'
              ? i18n.t('Dataset')
              : humanize(parameter.name)
    const placeholder =
        parameter.default !== undefined
            ? i18n.t('Default: {{value}}', {
                  value: String(parameter.default),
                  nsSeparator: '~~',
              })
            : undefined

    const selectOptions =
        kind === 'dataset'
            ? options.datasets.map((item) => ({
                  value: item.id,
                  label: item.name,
              }))
            : kind === 'features'
              ? options.collections.map((item) => {
                    const ok = hasOnlyAreas(item.geometryTypes)
                    return {
                        value: item.id,
                        label: ok
                            ? item.name
                            : i18n.t('{{name}} (has {{types}}, not usable)', {
                                  name: item.name,
                                  types: item.geometryTypes
                                      .filter((type) => !AREA_TYPES.has(type))
                                      .join(', '),
                              }),
                        disabled: !ok,
                    }
                })
              : kind === 'enum'
                ? ((parameter.schema.enum as unknown[]) ?? []).map((value) => ({
                      value: String(value),
                      label: String(value),
                  }))
                : kind === 'boolean'
                  ? [
                        { value: 'true', label: i18n.t('Yes') },
                        { value: 'false', label: i18n.t('No') },
                    ]
                  : null

    return (
        <Controller
            name={`arguments.${parameter.name}`}
            control={control}
            render={({ field, fieldState }) => {
                const value = (field.value as string | undefined) ?? ''
                if (selectOptions) {
                    return (
                        <Field
                            label={label}
                            required={parameter.required}
                            error={Boolean(fieldState.error)}
                            validationText={fieldState.error?.message}
                        >
                            <SingleSelectControl
                                name={field.name}
                                value={value}
                                options={selectOptions}
                                placeholder={placeholder}
                                error={Boolean(fieldState.error)}
                                filterable={selectOptions.length > 8}
                                clearable={!parameter.required}
                                clearText={i18n.t('Clear')}
                                onChange={field.onChange}
                            />
                        </Field>
                    )
                }
                const Input = kind === 'json' ? TextAreaField : InputField
                return (
                    <Input
                        label={label}
                        required={parameter.required}
                        name={field.name}
                        value={value}
                        type={kind === 'number' ? 'number' : undefined}
                        placeholder={placeholder}
                        onChange={({ value: next }: { value?: string }) =>
                            field.onChange(next ?? '')
                        }
                        onBlur={field.onBlur}
                        error={Boolean(fieldState.error)}
                        validationText={fieldState.error?.message}
                    />
                )
            }}
        />
    )
}
