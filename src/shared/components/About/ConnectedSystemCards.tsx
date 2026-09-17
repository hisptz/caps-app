import i18n from '@dhis2/d2-i18n'
import * as React from 'react'
import { SystemHealthCard } from './SystemHealthCard'
import type { SystemHealthCardAccent } from './SystemHealthCard'
import {
    filterDetailRows,
    formatWhenPresent,
    shortRevision,
} from './systemInfoHelpers'
import type { CapsSystemInfoPayload } from '@/capsApi/types'

export interface ConnectedSystemCardsProps {
    caps: CapsSystemInfoPayload
    checkedLabel: string
    latencyMs: number | undefined
}

export const ConnectedSystemCards: React.FC<ConnectedSystemCardsProps> = ({
    caps,
    checkedLabel,
    latencyMs,
}) => {
    const chapInfo = caps.chap.info ?? undefined
    const dhisInfo = caps.dhis.info ?? undefined
    const climateApiInfo = caps.climateApi.info ?? undefined

    const chapRows = filterDetailRows(
        chapInfo
            ? [
                  {
                      label: i18n.t('Core version'),
                      value: chapInfo.chap_core_version,
                  },
                  {
                      label: i18n.t('Python'),
                      value: chapInfo.python_version,
                  },
                  {
                      label: i18n.t('Revision'),
                      value: shortRevision(chapInfo.revision),
                  },
                  {
                      label: i18n.t('Server time'),
                      value: formatWhenPresent(chapInfo.server_date),
                  },
                  {
                      label: i18n.t('Time zone'),
                      value: chapInfo.server_time_zone_id,
                  },
                  {
                      label: i18n.t('Auth required'),
                      value:
                          chapInfo.auth_required == null
                              ? undefined
                              : chapInfo.auth_required
                                ? i18n.t('Yes')
                                : i18n.t('No'),
                  },
              ]
            : []
    )

    const dhisRows = filterDetailRows(
        dhisInfo
            ? [
                  {
                      label: i18n.t('DHIS2 version'),
                      value: dhisInfo.version,
                  },
                  {
                      label: i18n.t('System name'),
                      value: dhisInfo.systemName,
                  },
                  {
                      label: i18n.t('Base URL'),
                      value: dhisInfo.contextPath,
                  },
                  {
                      label: i18n.t('Revision'),
                      value: dhisInfo.revision,
                  },
                  {
                      label: i18n.t('Server time'),
                      value: formatWhenPresent(dhisInfo.serverDate),
                  },
              ]
            : []
    )

    const climateRows = filterDetailRows(
        climateApiInfo
            ? [
                  {
                      label: i18n.t('API version'),
                      value: climateApiInfo.app_version,
                  },
                  {
                      label: i18n.t('Python'),
                      value: climateApiInfo.python_version,
                  },
                  {
                      label: i18n.t('Mode'),
                      value:
                          climateApiInfo.read_only == null
                              ? undefined
                              : climateApiInfo.read_only
                                ? i18n.t('Read-only')
                                : i18n.t('Read/write'),
                  },
              ]
            : []
    )

    const capsRows = filterDetailRows([
        { label: i18n.t('Version'), value: caps.version },
        { label: i18n.t('Build'), value: i18n.t('dev · local') },
        { label: i18n.t('Endpoint'), value: i18n.t('in-process') },
    ])

    type CardDef = {
        id: string
        title: string
        description: string
        initial: string
        accent: SystemHealthCardAccent
        connected: boolean
        rows: { label: string; value: string }[]
    }

    const defs: CardDef[] = [
        {
            id: 'caps-api',
            title: i18n.t('CAPS API'),
            description: i18n.t('Central orchestration service'),
            initial: 'C',
            accent: 'blue',
            connected: true,
            rows: capsRows,
        },
        {
            id: 'chap',
            title: i18n.t('CHAP'),
            description: i18n.t('Climate & Health Analytics Platform'),
            initial: 'H',
            accent: 'green',
            connected: caps.chap.connected,
            rows: chapRows,
        },
        {
            id: 'dhis2',
            title: i18n.t('DHIS2'),
            description: i18n.t('Host instance · platform API'),
            initial: 'D',
            accent: 'blue',
            connected: caps.dhis.connected,
            rows: dhisRows,
        },
        {
            id: 'climate-api',
            title: i18n.t('Open Climate Service'),
            description: i18n.t('Climate data source · openEO API'),
            initial: 'O',
            accent: 'orange',
            connected: caps.climateApi.connected,
            rows: climateRows,
        },
    ]

    return (
        <>
            {defs.map((def) => (
                <SystemHealthCard
                    key={def.id}
                    id={def.id}
                    title={def.title}
                    description={def.description}
                    initial={def.initial}
                    accent={def.accent}
                    connected={def.connected}
                    rows={def.rows}
                    checkedLabel={checkedLabel}
                    latencyMs={def.connected ? latencyMs : undefined}
                />
            ))}
        </>
    )
}
