import i18n from '@dhis2/d2-i18n'
import { Checkbox } from '@dhis2/ui'
import React from 'react'
import { Controller, useFormContext, useWatch } from 'react-hook-form'
import classes from '../WorkflowTemplatePage.module.css'
import type { TemplateFormValues } from '@/modules/workflows/schemas/templateFormSchema'
import { FormSection } from '@/shared/components/ui/FormPrimitives'
import { UserGroupSelector } from '@/shared/components/UserGroupSelector/UserGroupSelector'
import { UserSelector } from '@/shared/components/UserSelector/UserSelector'

type Recipients = {
    on: 'notifyOnSuccess' | 'notifyOnFailure'
    users: 'successUsers' | 'failureUsers'
    groups: 'successGroups' | 'failureGroups'
}

function NotifyOption({
    on,
    users,
    groups,
    label,
    help,
}: Recipients & { label: string; help: string }) {
    const { control } = useFormContext<TemplateFormValues>()
    const enabled = useWatch({ control, name: on })
    return (
        <div className={classes.option}>
            <Controller
                name={on}
                control={control}
                render={({ field }) => (
                    <Checkbox
                        label={label}
                        checked={field.value}
                        onChange={({ checked }) => field.onChange(checked)}
                    />
                )}
            />
            <p className={classes.optionHelp}>{help}</p>
            {enabled && (
                <div className={classes.optionBody}>
                    <Controller
                        name={users}
                        control={control}
                        render={({ field, fieldState }) => (
                            <>
                                <UserSelector
                                    label={i18n.t('Users')}
                                    selected={field.value}
                                    onChange={field.onChange}
                                />
                                {fieldState.error && (
                                    <p className={classes.fieldError}>
                                        {fieldState.error.message}
                                    </p>
                                )}
                            </>
                        )}
                    />
                    <Controller
                        name={groups}
                        control={control}
                        render={({ field }) => (
                            <UserGroupSelector
                                label={i18n.t('User groups')}
                                selected={field.value}
                                onChange={field.onChange}
                            />
                        )}
                    />
                </div>
            )}
        </div>
    )
}

/** Steps every template can add: analytics after saving data, and messages. */
export function OptionsSection({
    num,
    showAnalytics = true,
}: {
    num: number
    /** Off for "Run a prediction", which saves no data */
    showAnalytics?: boolean
}): React.ReactElement {
    const { control } = useFormContext<TemplateFormValues>()
    return (
        <FormSection num={num} title={i18n.t('Options')}>
            {showAnalytics && (
                <div className={classes.option}>
                    <Controller
                        name="runAnalytics"
                        control={control}
                        render={({ field }) => (
                            <Checkbox
                                label={i18n.t(
                                    'Run analytics after saving data'
                                )}
                                checked={field.value}
                                onChange={({ checked }) =>
                                    field.onChange(checked)
                                }
                            />
                        )}
                    />
                    <p className={classes.optionHelp}>
                        {i18n.t(
                            'Recommended: new values show in dashboards and can be used by CHAP. Runs once, after all the data is in.'
                        )}
                    </p>
                </div>
            )}
            <NotifyOption
                on="notifyOnSuccess"
                users="successUsers"
                groups="successGroups"
                label={i18n.t('Notify when the workflow succeeds')}
                help={i18n.t(
                    'A DHIS2 message with a link to the run, once the last pipeline finishes.'
                )}
            />
            <NotifyOption
                on="notifyOnFailure"
                users="failureUsers"
                groups="failureGroups"
                label={i18n.t('Notify when a pipeline fails')}
                help={i18n.t(
                    'A DHIS2 message saying which step failed, with a link to the run.'
                )}
            />
        </FormSection>
    )
}
