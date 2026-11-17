import i18n from '@dhis2/d2-i18n'
import React from 'react'
import { ConnectedInstanceField } from './ConnectedInstanceField'
import { FormSection } from '@/shared/components/ui/FormPrimitives'

export function ConnectedInstanceSection({
    title,
    description,
    noInstancesText,
}: {
    title: string
    description: string
    noInstancesText: string
}): React.ReactElement {
    return (
        <FormSection title={title} description={description} tight>
            <ConnectedInstanceField
                name="handlerConfig.routeCode"
                label={i18n.t('Instance')}
                noInstancesText={noInstancesText}
            />
        </FormSection>
    )
}
