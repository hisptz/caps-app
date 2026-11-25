import i18n from '@dhis2/d2-i18n'
import React from 'react'
import { ConnectedInstanceField } from '../ConnectedInstanceField'
import { DataElementSelector } from '../DataElementSelector'
import { PullPeriodFields } from '../Dhis2InstancePullConfig/PullPeriodFields'
import { OrganisationUnitConfigSection } from '../OrganisationUnitConfigSection'
import type { CapsField } from './jsonSchema'
import { SchemaClimatePeriodField } from './SchemaClimatePeriodField'
import { SchemaDataElementListField } from './SchemaDataElementListField'
import { SchemaGroup } from './SchemaGroup'
import { SchemaUserGroupsField } from './SchemaUserGroupsField'
import { GeoservicePipelineField } from '@/modules/geoservice-pipelines/components/GeoservicePipelineField'

export interface SchemaPickerFieldProps {
    name: string
    label: string
    helpText?: string
    required: boolean
    picker: CapsField
    list: boolean
}

/** The DHIS2 picker a field's hint asks for (`capsField()` in the engine). */
export function SchemaPickerField({
    name,
    label,
    helpText,
    required,
    picker,
    list,
}: SchemaPickerFieldProps): React.ReactElement {
    const common = { name, label, helpText, required }

    switch (picker) {
        case 'dataElement':
            return list ? (
                <SchemaDataElementListField {...common} />
            ) : (
                <DataElementSelector name={name} label={label} />
            )
        case 'orgUnits':
            return (
                <SchemaGroup {...common}>
                    <OrganisationUnitConfigSection name={name} />
                </SchemaGroup>
            )
        case 'period':
            return (
                <SchemaGroup {...common}>
                    <PullPeriodFields name={name} />
                </SchemaGroup>
            )
        case 'connectedInstance':
            return (
                <ConnectedInstanceField
                    name={name}
                    label={label}
                    required={required}
                    noInstancesText={i18n.t(
                        'Connect an instance under Settings › Connected instances first.'
                    )}
                />
            )
        case 'userGroups':
            return <SchemaUserGroupsField {...common} />
        case 'climatePeriod':
            return <SchemaClimatePeriodField {...common} />
        case 'ocsPipeline':
            return <GeoservicePipelineField {...common} />
    }
}
