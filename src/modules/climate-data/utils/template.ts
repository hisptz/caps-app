import type { ClimateDatasetTemplate } from '@/capsApi/types'

export const FUTURE_TEMPORAL_DIRECTION = 'future'

export function getTemplateTemporalExtent(
    template: ClimateDatasetTemplate | undefined
) {
    return template?.extents?.temporal
}

export function isFutureTemplate(
    template: ClimateDatasetTemplate | undefined
): boolean {
    return template?.temporal_direction === FUTURE_TEMPORAL_DIRECTION
}
