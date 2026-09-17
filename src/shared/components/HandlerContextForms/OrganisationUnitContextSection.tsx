import i18n from '@dhis2/d2-i18n'
import { Field } from '@dhis2/ui'
import React from 'react'
import { OrgUnitTreeSelection } from '../HandlerConfigForms/OrgUnitTreeSelection'
import { FormSection } from '@/shared/components/ui/FormPrimitives'

export interface OrgUnitValue {
    ids: string[] | undefined
    levels: number[] | undefined
    groups: string[] | undefined
}

export interface OrganisationUnitContextSectionProps {
    value: OrgUnitValue | null
    onChange: (v: OrgUnitValue) => void
}

export function OrganisationUnitContextSection({
    value,
    onChange,
}: OrganisationUnitContextSectionProps): React.ReactElement {
    return (
        <FormSection
            title={i18n.t('Organisation units')}
            description={i18n.t('Override org units for this run')}
            tight
        >
            <Field>
                <OrgUnitTreeSelection
                    ids={value?.ids}
                    levels={value?.levels}
                    groups={value?.groups}
                    onChange={onChange}
                />
            </Field>
        </FormSection>
    )
}
