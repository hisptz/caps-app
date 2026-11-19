import i18n from '@dhis2/d2-i18n'
import { SingleSelectField, SingleSelectOption } from '@dhis2/ui'
import React from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import {
    humanizeKey,
    variantDefaults,
    variantFields,
    type SchemaNode,
} from './jsonSchema'
import classes from './SchemaConfigForm.module.css'
import { SchemaObjectFields } from './SchemaObjectFields'

export interface SchemaVariantFieldProps {
    name: string
    label: string
    helpText?: string
    required: boolean
    node: Extract<SchemaNode, { kind: 'variant' }>
}

export function SchemaVariantField({
    name,
    label,
    helpText,
    required,
    node,
}: SchemaVariantFieldProps): React.ReactElement {
    const { setValue, getFieldState, formState } = useFormContext()
    const current = useWatch({ name: `${name}.${node.discriminator}` })
    const fields = variantFields(node, current)
    const pickerName = `${name}.${node.discriminator}`
    const error = getFieldState(pickerName, formState).error

    return (
        <fieldset className={classes.group}>
            <legend className={classes.legend}>
                {label}
                {required ? ' *' : ''}
            </legend>
            {helpText ? <p className={classes.help}>{helpText}</p> : null}
            <div className={classes.list}>
                <SingleSelectField
                    label={humanizeKey(node.discriminator)}
                    required={required}
                    placeholder={i18n.t('Choose an option')}
                    clearable={!required}
                    clearText={i18n.t('Clear')}
                    selected={typeof current === 'string' ? current : ''}
                    onChange={({ selected }) =>
                        setValue(
                            name,
                            selected
                                ? variantDefaults(node, selected)
                                : undefined,
                            { shouldDirty: true, shouldValidate: true }
                        )
                    }
                    error={Boolean(error)}
                    validationText={error?.message}
                >
                    {node.options.map((option) => (
                        <SingleSelectOption
                            key={option.value}
                            value={option.value}
                            label={humanizeKey(option.value)}
                        />
                    ))}
                </SingleSelectField>
                {fields ? (
                    <SchemaObjectFields
                        key={String(current)}
                        name={name}
                        schema={fields}
                    />
                ) : null}
            </div>
        </fieldset>
    )
}
