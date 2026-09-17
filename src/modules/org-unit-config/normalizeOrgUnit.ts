import type { OrgUnitConfig } from './constants'

type OrgUnitConfigInput = {
    ids?: string[]
    levels?: number[]
    groups?: string[]
}

export function normalizeOrgUnitConfig(raw: unknown): OrgUnitConfig {
    if (typeof raw !== 'object' || raw === null) {
        return {}
    }
    const ou = raw as OrgUnitConfigInput

    const ids = Array.isArray(ou.ids)
        ? [...new Set(ou.ids.map((id) => String(id).trim()).filter(Boolean))]
        : undefined

    const levels = new Set<number>()
    if (Array.isArray(ou.levels)) {
        for (const level of ou.levels) {
            const n = typeof level === 'number' ? level : Number(level)
            if (Number.isInteger(n) && n > 0) {
                levels.add(n)
            }
        }
    }

    const groups = new Set<string>()
    if (Array.isArray(ou.groups)) {
        for (const groupId of ou.groups) {
            const trimmed = String(groupId).trim()
            if (trimmed) {
                groups.add(trimmed)
            }
        }
    }

    const result: OrgUnitConfig = {}
    if (ids && ids.length > 0) {
        result.ids = ids
    }
    if (levels.size > 0) {
        result.levels = [...levels]
    }
    if (groups.size > 0) {
        result.groups = [...groups]
    }
    return result
}

export function emitOrgUnitConfig(raw: unknown): OrgUnitConfig {
    return normalizeOrgUnitConfig(raw)
}
