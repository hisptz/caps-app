import { z } from 'zod'
import { readableConfigIssue } from '@/modules/pipeline-detail/schemas/stepFormSchema'

function issueFor(schema: z.ZodType, value: unknown) {
    const result = schema.safeParse(value)
    if (result.success) {
        throw new Error('expected an issue')
    }
    return result.error.issues[0]!
}

describe('readableConfigIssue', () => {
    it('says to pick a data element when a data element list is empty', () => {
        const schema = z.object({ mapped: z.array(z.string()).min(1) })
        expect(readableConfigIssue(issueFor(schema, { mapped: [] }))).toBe(
            'Pick at least one data element'
        )
    })

    it('keeps the message of other issues', () => {
        const schema = z.object({ levels: z.array(z.number()).min(1) })
        expect(readableConfigIssue(issueFor(schema, { levels: [] }))).toBe(
            'Too small: expected array to have >=1 items'
        )
    })
})
