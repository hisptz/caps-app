import { useDataEngine } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import {
    InputField,
    NoticeBox,
    SingleSelectField,
    SingleSelectOption,
} from '@dhis2/ui'
import React from 'react'
import { Controller, useFormContext, useWatch } from 'react-hook-form'
import classes from '../WorkflowTemplatePage.module.css'
import type { TemplateFormValues } from '@/modules/workflows/schemas/templateFormSchema'
import { OrganisationUnitLevelSelector } from '@/shared/components/HandlerConfigForms/OrganisationUnitLevelSelector'
import { FormSection } from '@/shared/components/ui/FormPrimitives'
import { UserGroupSelector } from '@/shared/components/UserGroupSelector/UserGroupSelector'
import { UserSelector } from '@/shared/components/UserSelector/UserSelector'
import { useEvaluationsQuery } from '@/shared/hooks/useEvaluationsQuery'

const NONE = 'none'

/**
 * The CHAP prediction setup the workflow runs. Without one the workflow only gets the data
 * ready, so the modeller can evaluate a model and create the setup from it.
 */
export function PredictionSection({
    num = 2,
    required = false,
}: {
    num?: number
    /** The "Run a prediction" preset: no "none yet" choice */
    required?: boolean
}): React.ReactElement {
    const engine = useDataEngine()
    const { control } = useFormContext<TemplateFormValues>()
    const setupId = useWatch({ control, name: 'predictionSetupId' })
    const { data, isLoading } = useEvaluationsQuery(engine)

    // A setup is promoted from an evaluation; offer each setup once
    const setups = (data?.evaluations ?? []).filter(
        (e, index, all) =>
            e.predictionSetupId !== null &&
            all.findIndex(
                (other) => other.predictionSetupId === e.predictionSetupId
            ) === index
    )

    return (
        <FormSection
            num={num}
            title={i18n.t('Prediction')}
            description={i18n.t('from CHAP')}
        >
            {data?.error && (
                <NoticeBox warning title={i18n.t('CHAP could not be reached')}>
                    {data.error}
                </NoticeBox>
            )}
            <Controller
                name="predictionSetupId"
                control={control}
                render={({ field, fieldState }) => (
                    <SingleSelectField
                        label={i18n.t('Prediction setup')}
                        loading={isLoading}
                        required={required}
                        selected={field.value || (required ? undefined : NONE)}
                        onChange={({ selected }) =>
                            field.onChange(selected === NONE ? '' : selected)
                        }
                        error={Boolean(fieldState.error)}
                        validationText={fieldState.error?.message}
                        helpText={
                            field.value
                                ? i18n.t(
                                      'Its org units and inputs are used; you only say where each input comes from'
                                  )
                                : required
                                  ? i18n.t(
                                        'Promoted from an evaluation in the Modelling App'
                                    )
                                  : i18n.t(
                                        'Without one, the workflow gets the data ready so a model can be evaluated. Choose the setup here later.'
                                    )
                        }
                    >
                        {!required && (
                            <SingleSelectOption
                                value={NONE}
                                label={i18n.t(
                                    'None yet, only get the data ready'
                                )}
                            />
                        )}
                        {setups.map((e) => (
                            <SingleSelectOption
                                key={e.predictionSetupId}
                                value={String(e.predictionSetupId)}
                                label={`${e.name} (${e.modelDisplayName}${e.periodType ? `, ${e.periodType.toLowerCase()}` : ''})`}
                            />
                        ))}
                    </SingleSelectField>
                )}
            />
            {setupId && (
                <>
                    <Controller
                        name="periodsAhead"
                        control={control}
                        render={({ field, fieldState }) => (
                            <InputField
                                type="number"
                                min="1"
                                label={i18n.t('Periods to predict ahead')}
                                value={String(field.value)}
                                onChange={({ value }) =>
                                    field.onChange(Number(value))
                                }
                                error={Boolean(fieldState.error)}
                                validationText={fieldState.error?.message}
                                inputWidth="120px"
                            />
                        )}
                    />
                    <p className={classes.subheading}>
                        {i18n.t('Tell the modeller when a prediction is ready')}
                    </p>
                    <Controller
                        name="notifyUsers"
                        control={control}
                        render={({ field }) => (
                            <UserSelector
                                label={i18n.t('Users')}
                                selected={field.value}
                                onChange={field.onChange}
                            />
                        )}
                    />
                    <Controller
                        name="notifyGroups"
                        control={control}
                        render={({ field }) => (
                            <UserGroupSelector
                                label={i18n.t('User groups')}
                                selected={field.value}
                                onChange={field.onChange}
                                helpText={i18n.t(
                                    'Leave both empty to send no message'
                                )}
                            />
                        )}
                    />
                </>
            )}
        </FormSection>
    )
}

/** Where to fetch data for; with a prediction setup, its own org units are used. */
export function OrgUnitsSection({
    num = 3,
}: {
    num?: number
}): React.ReactElement {
    const { control } = useFormContext<TemplateFormValues>()
    const setupId = useWatch({ control, name: 'predictionSetupId' })
    const ids = useWatch({ control, name: 'orgUnitIds' })

    return (
        <FormSection num={num} title={i18n.t('Org units')}>
            {setupId ? (
                <p className={classes.help}>
                    {i18n.t(
                        'Taken from the prediction setup, so the data matches what the model was evaluated on.'
                    )}
                </p>
            ) : (
                <>
                    <Controller
                        name="orgUnitLevel"
                        control={control}
                        render={({ field, fieldState }) => (
                            <>
                                <OrganisationUnitLevelSelector
                                    label={i18n.t('Org unit level')}
                                    selected={field.value ? [field.value] : []}
                                    onChange={(selected) =>
                                        field.onChange(selected.at(-1) ?? '')
                                    }
                                    helpText={i18n.t(
                                        'Usually districts: climate is averaged over each one',
                                        { nsSeparator: '~~' }
                                    )}
                                />
                                {fieldState.error && (
                                    <p className={classes.fieldError}>
                                        {fieldState.error.message}
                                    </p>
                                )}
                            </>
                        )}
                    />
                    {ids.length > 0 && (
                        <p className={classes.help}>
                            {i18n.t('Limited to {{count}} chosen org unit(s)', {
                                count: ids.length,
                            })}
                        </p>
                    )}
                </>
            )}
        </FormSection>
    )
}
