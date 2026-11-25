import { geoserviceErrorMessages } from './geoserviceErrors'
import { CapsApiError } from '@/capsApi/client'

function refused(details: unknown, error = 'refused'): CapsApiError {
    return new CapsApiError(error, 422, { error, code: 'x', details })
}

describe('geoserviceErrorMessages', () => {
    it('lists the failing checks of a pipeline geoservice did not validate', () => {
        const error = refused({
            detail: {
                message: 'Pipeline validation failed',
                checks: {
                    checks: [
                        { id: 'workflow', status: 'pass', message: 'ok' },
                        {
                            id: 'destination',
                            status: 'fail',
                            message: 'Unknown data element',
                        },
                    ],
                },
            },
        })
        expect(geoserviceErrorMessages(error)).toEqual(['Unknown data element'])
    })

    it('names the fields of a body geoservice could not read', () => {
        const error = refused({
            detail: [
                { loc: ['body', 'workflow', 'id'], msg: 'Field required' },
            ],
        })
        expect(geoserviceErrorMessages(error)).toEqual([
            'workflow.id: Field required',
        ])
    })

    it('passes on a one-line reason', () => {
        expect(
            geoserviceErrorMessages(
                refused({
                    detail: 'Live delivery requires a successful dry run',
                })
            )
        ).toEqual(['Live delivery requires a successful dry run'])
    })
})
