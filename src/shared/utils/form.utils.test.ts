import { z } from 'zod'
import { applyZodErrorsToForm } from './form.utils'

describe('applyZodErrorsToForm', () => {
    const schema = z.object({
        name: z.string().min(1),
        nested: z.object({ value: z.string().min(1) }),
    })

    function parseFailure(input: unknown) {
        const result = schema.safeParse(input)
        if (result.success) {
            throw new Error('expected schema parse to fail')
        }
        return result.error
    }

    it('sets a field error for an issue with a path', () => {
        const error = parseFailure({ name: '', nested: { value: 'ok' } })
        const setError = jest.fn()

        applyZodErrorsToForm(error, setError)

        expect(setError).toHaveBeenCalledWith('name', {
            type: 'manual',
            message: expect.any(String),
        })
    })

    it('skips issues with an empty path', () => {
        const rootIssueError = new z.ZodError([
            {
                code: 'custom',
                path: [],
                message: 'root level problem',
            },
        ])
        const setError = jest.fn()

        applyZodErrorsToForm(rootIssueError, setError)

        expect(setError).not.toHaveBeenCalled()
    })

    it('applies every issue when there are multiple', () => {
        const error = parseFailure({ name: '', nested: { value: '' } })
        const setError = jest.fn()

        applyZodErrorsToForm(error, setError)

        expect(setError).toHaveBeenCalledTimes(2)
        expect(setError).toHaveBeenCalledWith(
            'name',
            expect.objectContaining({ type: 'manual' })
        )
        expect(setError).toHaveBeenCalledWith(
            'nested.value',
            expect.objectContaining({ type: 'manual' })
        )
    })
})
