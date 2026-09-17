import { Field } from '@dhis2/ui'
import React from 'react'
import { Controller } from 'react-hook-form'
import { OrgUnitTreeSelection } from './OrgUnitTreeSelection'
import classes from './ThresholdOrgUnitSection.module.css'

export function OrganisationUnitConfigSection(): React.ReactElement {
    return (
        <div className={classes.card}>
            <Controller
                name="handlerConfig.orgUnit"
                render={({ field, fieldState }) => {
                    return (
                        <Field
                            validationText={fieldState.error?.message}
                            error={!!fieldState.error?.message}
                        >
                            <OrgUnitTreeSelection
                                ids={field.value?.ids}
                                levels={field.value?.levels}
                                groups={field.value?.groups}
                                onChange={field.onChange}
                            />
                        </Field>
                    )
                }}
            />
        </div>
    )
}
