import i18n from '@dhis2/d2-i18n'
import { Tag } from '@dhis2/ui'
import React from 'react'

/** Active / Inactive, as the pipelines list shows it. */
export function ActiveTag({ active }: { active: boolean }): React.ReactElement {
    return active ? (
        <Tag positive>{i18n.t('Active')}</Tag>
    ) : (
        <Tag neutral>{i18n.t('Inactive')}</Tag>
    )
}
