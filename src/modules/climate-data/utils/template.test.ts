import type { ClimateDatasetTemplate } from '@/capsApi/types'
import {
    isFutureTemplate,
    FUTURE_TEMPORAL_DIRECTION,
} from '@/modules/climate-data/utils/template'

const baseTemplate: ClimateDatasetTemplate = {
    id: 'tpl-1',
    name: 'CHIRPS daily',
    variable: 'precip',
    period_type: 'daily',
}

describe('isFutureTemplate', () => {
    it('returns true when temporal_direction is future', () => {
        expect(
            isFutureTemplate({
                ...baseTemplate,
                temporal_direction: FUTURE_TEMPORAL_DIRECTION,
            })
        ).toBe(true)
    })

    it('returns false for historical or missing direction', () => {
        expect(isFutureTemplate(baseTemplate)).toBe(false)
        expect(
            isFutureTemplate({
                ...baseTemplate,
                temporal_direction: 'historical',
            })
        ).toBe(false)
        expect(isFutureTemplate(undefined)).toBe(false)
    })
})
