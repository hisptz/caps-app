import i18n from '@dhis2/d2-i18n'
import { OrgUnitSelector } from '@hisptz/dhis2-ui'
import React, { useState } from 'react'
import { ConfigLabeledControl } from './ConfigLabeledControl'
import { OrganisationUnitLevelSelector } from './OrganisationUnitLevelSelector'
import classes from './ThresholdOrgUnitSection.module.css'
import { useOrgUnitPaths } from './useOrgUnitPaths'
import { SegmentedControl } from '@/shared/components/ui/FormPrimitives'

interface OrgUnitSectionProps {
    value: Record<string, unknown> | null
    onChange: (orgUnit: Record<string, unknown>) => void
}

type OrgUnitMode = 'levels' | 'ids'

const MODE_OPTIONS = [
    { value: 'levels' as const, label: i18n.t('By level') },
    { value: 'ids' as const, label: i18n.t('By org unit') },
]

function getOrgUnitMode(value: Record<string, unknown> | null): OrgUnitMode {
    if (!value) {
        return 'levels'
    }
    const orgUnit = value.orgUnit
    if (typeof orgUnit === 'object' && orgUnit !== null) {
        if ('ids' in orgUnit) {
            return 'ids'
        }
    }
    return 'levels'
}

function getOrgUnitIds(value: Record<string, unknown> | null): string[] {
    if (!value) {
        return []
    }
    const orgUnit = value.orgUnit
    if (typeof orgUnit !== 'object' || orgUnit === null) {
        return []
    }
    const ou = orgUnit as Record<string, unknown>
    const arr = ou.ids
    if (!Array.isArray(arr)) {
        return []
    }
    return arr.map((id) => String(id).trim()).filter(Boolean)
}

function getOrgUnitLevels(value: Record<string, unknown> | null): string[] {
    if (!value) {
        return []
    }
    const orgUnit = value.orgUnit
    if (typeof orgUnit !== 'object' || orgUnit === null) {
        return []
    }
    const ou = orgUnit as Record<string, unknown>
    const arr = ou.levels
    if (!Array.isArray(arr)) {
        return []
    }
    return arr.map((level) => String(level).trim()).filter(Boolean)
}

export function OrgUnitSection({
    value,
    onChange,
}: OrgUnitSectionProps): React.ReactElement {
    const [mode, setMode] = useState<OrgUnitMode>(() => getOrgUnitMode(value))

    const selectedIds = getOrgUnitIds(value)
    const selectedLevels = getOrgUnitLevels(value)
    const { orgUnits, rememberSelection } = useOrgUnitPaths(selectedIds)

    function handleModeChange(newMode: OrgUnitMode): void {
        setMode(newMode)
        onChange({ orgUnit: { [newMode]: [] } })
    }

    function handleIdsChange(ids: string[]): void {
        onChange({ orgUnit: { ids } })
    }

    function handleLevelsChange(levels: string[]): void {
        onChange({ orgUnit: { levels } })
    }

    return (
        <>
            <ConfigLabeledControl
                label={i18n.t('Organisation unit mode')}
                helpText={i18n.t(
                    'Choose whether to target org units by level or by picking them from the hierarchy.'
                )}
            >
                <SegmentedControl
                    name="org-unit-mode"
                    value={mode}
                    options={MODE_OPTIONS}
                    onChange={handleModeChange}
                    aria-label={i18n.t('Organisation unit mode')}
                />
            </ConfigLabeledControl>
            {mode === 'levels' ? (
                <OrganisationUnitLevelSelector
                    label={i18n.t('Organisation unit levels')}
                    selected={selectedLevels}
                    onChange={handleLevelsChange}
                    helpText={i18n.t(
                        'Select one or more organisation unit levels from your DHIS2 instance.'
                    )}
                />
            ) : (
                <ConfigLabeledControl
                    label={i18n.t('Organisation units')}
                    helpText={i18n.t(
                        'Select one or more organisation units from the hierarchy.'
                    )}
                >
                    <div className={classes.card}>
                        <OrgUnitSelector
                            searchable
                            value={{ orgUnits }}
                            onUpdate={(selection) => {
                                const selectedUnits = selection.orgUnits ?? []
                                rememberSelection(selectedUnits)
                                handleIdsChange(
                                    selectedUnits.map(({ id }) => id)
                                )
                            }}
                        />
                    </div>
                </ConfigLabeledControl>
            )}
        </>
    )
}
