import { OrgUnitSelector } from '@hisptz/dhis2-ui'
import React from 'react'
import { useOrgUnitPaths } from './useOrgUnitPaths'

export interface OrgUnitTreeSelectionValue {
    ids: string[] | undefined
    levels: number[] | undefined
    groups: string[] | undefined
}

export interface OrgUnitTreeSelectionProps {
    ids?: string[] | null
    levels?: number[] | null
    groups?: string[] | null
    onChange: (value: OrgUnitTreeSelectionValue) => void
}

export function OrgUnitTreeSelection({
    ids,
    levels,
    groups,
    onChange,
}: OrgUnitTreeSelectionProps): React.ReactElement {
    const { orgUnits, rememberSelection } = useOrgUnitPaths(ids ?? [])

    return (
        <OrgUnitSelector
            searchable
            showGroups
            showLevels
            value={{
                orgUnits,
                levels: levels?.map((level) => String(level)),
                groups: groups ?? undefined,
            }}
            onUpdate={(selection) => {
                const selectedUnits = selection.orgUnits ?? []
                rememberSelection(selectedUnits)
                onChange({
                    ids: selectedUnits.map(({ id }) => id),
                    levels: selection.levels?.map((level) =>
                        Number.parseInt(level, 10)
                    ),
                    groups: selection.groups,
                })
            }}
        />
    )
}
