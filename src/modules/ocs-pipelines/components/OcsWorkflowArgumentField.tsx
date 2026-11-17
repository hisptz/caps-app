import i18n from '@dhis2/d2-i18n'
import { InputField, TextAreaField } from '@dhis2/ui'
import React from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { parameterKind } from '../schemas/ocsPipelineFormSchema'
import classes from './OcsPipeline.module.css'
import type {
    OcsPipelineOptions,
    OcsWorkflowParameterOption,
} from '@/capsApi/types'
import { SingleSelectControl } from '@/shared/components/ui/FormPrimitives'

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
    const name = `arguments.${parameter.name}`
    const label = `${humanize(parameter.name)}${parameter.required ? ' *' : ''}`
    const defaultHint =
        parameter.default !== undefined
            ? i18n.t('Default: {{value}}', {
                  value: JSON.stringify(parameter.default),
                  nsSeparator: '~~',
              })
            : undefined
    const help =
        [parameter.description, defaultHint].filter(Boolean).join(' ') ||
        undefined

    const selectOptions =
        kind === 'dataset'
            ? options.datasets.map((item) => ({
                  value: item.id,
                  label: item.periodType
                      ? `${item.name} (${item.periodType})`
                      : item.name,
              }))
            : kind === 'features'
              ? options.collections.map((item) => ({
                    value: item.id,
                    label:
                        typeof item.featureCount === 'number'
                            ? i18n.t('{{name}} ({{count}} features)', {
                                  name: item.name,
                                  count: item.featureCount,
                              })
                            : item.name,
                }))
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
            name={name}
            control={control}
            render={({ field, fieldState }) => {
                const value = (field.value as string | undefined) ?? ''
                if (selectOptions) {
                    return (
                        <div>
                            <label className={classes.label}>{label}</label>
                            <SingleSelectControl
                                name={field.name}
                                value={value}
                                options={selectOptions}
                                error={Boolean(fieldState.error)}
                                filterable={selectOptions.length > 8}
                                clearable={!parameter.required}
                                clearText={i18n.t('Clear')}
                                placeholder={
                                    kind === 'features'
                                        ? i18n.t('Choose a feature collection')
                                        : kind === 'dataset'
                                          ? i18n.t('Choose a dataset')
                                          : undefined
                                }
                                onChange={field.onChange}
                            />
                            <p
                                className={
                                    fieldState.error
                                        ? classes.error
                                        : classes.help
                                }
                            >
                                {fieldState.error?.message ?? help}
                            </p>
                        </div>
                    )
                }
                const Field = kind === 'json' ? TextAreaField : InputField
                return (
                    <Field
                        label={label}
                        name={field.name}
                        value={value}
                        type={kind === 'number' ? 'number' : undefined}
                        helpText={
                            kind === 'json' ? (help ?? i18n.t('JSON')) : help
                        }
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
