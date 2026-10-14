import type { ClimateDataSource } from '@/capsApi/types'

export const FUTURE_TEMPORAL_DIRECTION = 'future'

export function getTemplateTemporalExtent(
    template: ClimateDataSource | undefined
) {
    return template?.extents?.temporal
}

export function isFutureTemplate(
    template: ClimateDataSource | undefined
): boolean {
    return template?.temporal_direction === FUTURE_TEMPORAL_DIRECTION
}
