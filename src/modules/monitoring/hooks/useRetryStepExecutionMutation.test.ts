jest.mock('@dhis2/d2-i18n', () => ({
    __esModule: true,
    default: {
        t: (value: string) => value,
    },
}))

import { CapsApiError } from '@/capsApi/client'
import { mapRetryStepError } from '@/modules/monitoring/hooks/useRetryStepExecutionMutation'

describe('mapRetryStepError', () => {
    it('uses CapsApiError message when present', () => {
        expect(
            mapRetryStepError(
                new CapsApiError('Step execution is not retryable', 409, {
                    code: 'NOT_LATEST_ATTEMPT',
                })
            )
        ).toBe('Step execution is not retryable')
    })

    it('falls back for unknown errors', () => {
        expect(mapRetryStepError(new Error('nope'))).toMatch(/Could not retry/i)
    })
})
