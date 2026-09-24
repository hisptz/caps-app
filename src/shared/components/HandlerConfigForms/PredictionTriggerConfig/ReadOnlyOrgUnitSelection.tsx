import { useDataQuery } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import { CircularLoader, InputField, OrganisationUnitTree } from '@dhis2/ui'
import React, { useMemo, useState } from 'react'
import { ConfigLabeledControl } from '../ConfigLabeledControl'
import { useOrganisationUnitLevelOptions } from '../useOrganisationUnitLevelOptions'
import { SegmentedControl } from '@/shared/components/ui/FormPrimitives'

export interface ReadOnlyOrgUnitSelectionProps {
    orgUnitIds: string[]
}

type OrgUnitRow = {
    id: string
    displayName: string
    level: number
    path: string
}

type SelectionResponse = {
    units: {
        organisationUnits?: OrgUnitRow[]
    }
    roots: {
        organisationUnits?: Array<{ id: string }>
    }
}

const selectionQuery = {
    units: {
        resource: 'organisationUnits',
        params: ({ ids }: { ids?: string[] }) => ({
            fields: 'id,displayName,level,path',
            filter: ids?.length ? [`id:in:[${ids.join(',')}]`] : undefined,
            paging: false,
        }),
    },
    roots: {
        resource: 'organisationUnits',
        params: {
            fields: 'id',
            filter: 'level:eq:1',
            paging: false,
        },
    },
}

type OrgUnitTreeRuntimeProps = {
    roots: string[]
    selected: string[]
    expanded: string[]
    onExpand: (event: { path: string }) => void
    onCollapse: (event: { path: string }) => void
    onChange: () => void
}

const OrgUnitTree =
    OrganisationUnitTree as unknown as React.FC<OrgUnitTreeRuntimeProps>

const MODE_OPTIONS = [
    { value: 'level', label: i18n.t('By level') },
    { value: 'orgUnit', label: i18n.t('By org unit') },
] as const

export function ReadOnlyOrgUnitSelection({
    orgUnitIds,
}: ReadOnlyOrgUnitSelectionProps): React.ReactElement {
    const [expanded, setExpanded] = useState<string[]>([])
    const { data, loading } = useDataQuery<SelectionResponse>(selectionQuery, {
        variables: { ids: orgUnitIds },
    })
    const { options: levelOptions } = useOrganisationUnitLevelOptions()

    const units = useMemo(() => data?.units?.organisationUnits ?? [], [data])
    const paths = useMemo(() => units.map((unit) => unit.path), [units])

    const commonLevel = useMemo(() => {
        const levels = new Set(units.map((unit) => unit.level))
        return levels.size === 1 ? [...levels][0] : undefined
    }, [units])

    const levelName = useMemo(() => {
        const match = levelOptions.find(
            (option) => option.value === String(commonLevel)
        )
        return match?.label ?? i18n.t('Level {{level}}', { level: commonLevel })
    }, [levelOptions, commonLevel])

    const defaultExpanded = useMemo(
        () =>
            Array.from(
                new Set(
                    paths.map(
                        (path) => path.slice(0, path.lastIndexOf('/')) || path
                    )
                )
            ),
        [paths]
    )

    if (loading) {
        return <CircularLoader small />
    }

    const mode = commonLevel !== undefined ? 'level' : 'orgUnit'
    const roots = data?.roots?.organisationUnits?.map(({ id }) => id) ?? []

    return (
        <>
            <ConfigLabeledControl label={i18n.t('Organisation unit mode')}>
                <SegmentedControl
                    name="setupOrgUnitMode"
                    value={mode}
                    options={MODE_OPTIONS}
                    onChange={() => undefined}
                    disabled
                    aria-label={i18n.t('Organisation unit mode')}
                />
            </ConfigLabeledControl>

            {mode === 'level' ? (
                <InputField
                    label={i18n.t('Organisation unit level')}
                    helpText={i18n.t(
                        '{{count}} organisation units, set by the evaluation this step runs.',
                        { count: units.length }
                    )}
                    value={levelName}
                    disabled
                    onChange={() => undefined}
                />
            ) : (
                <ConfigLabeledControl
                    label={i18n.t('Organisation units')}
                    helpText={i18n.t(
                        '{{count}} selected, set by the evaluation this step runs.',
                        { count: units.length }
                    )}
                >
                    <div
                        style={{
                            maxHeight: 220,
                            overflow: 'auto',
                            border: '1px solid #d5dde5',
                            borderRadius: 4,
                            padding: 8,
                        }}
                    >
                        <OrgUnitTree
                            roots={roots}
                            selected={paths}
                            expanded={
                                expanded.length > 0 ? expanded : defaultExpanded
                            }
                            onExpand={({ path }) =>
                                setExpanded((current) => [...current, path])
                            }
                            onCollapse={({ path }) =>
                                setExpanded((current) =>
                                    current.filter((item) => item !== path)
                                )
                            }
                            onChange={() => undefined}
                        />
                    </div>
                </ConfigLabeledControl>
            )}
        </>
    )
}
