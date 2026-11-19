import { ocsErrorMessages } from './ocsErrors'
import { CapsApiError } from '@/capsApi/client'

function refused(details: unknown, error = 'refused'): CapsApiError {
    return new CapsApiError(error, 422, { error, code: 'x', details })
}

describe('ocsErrorMessages', () => {
    it('lists the failing checks of a pipeline OCS did not validate', () => {
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
        expect(ocsErrorMessages(error)).toEqual(['Unknown data element'])
    })

    it('names the fields of a body OCS could not read', () => {
        const error = refused({
            detail: [
                { loc: ['body', 'workflow', 'id'], msg: 'Field required' },
            ],
        })
        expect(ocsErrorMessages(error)).toEqual(['workflow.id: Field required'])
    })

    it('passes on a one-line reason', () => {
        expect(
            ocsErrorMessages(
                refused({
                    detail: 'Live delivery requires a successful dry run',
                })
            )
        ).toEqual(['Live delivery requires a successful dry run'])
    })
})
