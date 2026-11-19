import { useDataEngine } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import { NoticeBox } from '@dhis2/ui'
import React from 'react'
import { useHandlersQuery } from '@/modules/handlers/hooks/useHandlersQuery'
import { getHandlerByKey } from '@/modules/handlers/utils/handlerLookup'
import { SchemaConfigForm } from '@/shared/components/HandlerConfigForms/SchemaConfigForm'
import { FormSection } from '@/shared/components/ui/FormPrimitives'

export interface GenericHandlerConfigProps {
    handlerKey: string
    onChange: (value: Record<string, unknown>) => void
}

export function GenericHandlerConfig({
    handlerKey,
    onChange,
}: GenericHandlerConfigProps): React.ReactElement | null {
    const engine = useDataEngine()
    const { data: handlers = [] } = useHandlersQuery(engine)
    const descriptor = getHandlerByKey(handlers, handlerKey)

    if (!descriptor) {
        return null
    }

    const schema = descriptor.schemas?.config
    if (!schema) {
        return (
            <NoticeBox title={i18n.t('Nothing to set up')}>
                {i18n.t('This step runs without any settings.')}
            </NoticeBox>
        )
    }

    return (
        <FormSection title={i18n.t('Settings')} tight>
            <SchemaConfigForm
                name="handlerConfig"
                schema={schema}
                onChange={onChange}
            />
        </FormSection>
    )
}
