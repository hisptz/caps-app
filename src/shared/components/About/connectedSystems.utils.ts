import type { CapsSystemInfoPayload } from '@/capsApi/types'

export function countHealthy(caps: CapsSystemInfoPayload): {
    healthy: number
    total: number
} {
    const systems = [
        true,
        caps.chap.connected,
        caps.dhis.connected,
        caps.climateApi.connected,
    ]
    const total = systems.length
    const healthy = systems.filter(Boolean).length
    return { healthy, total }
}
