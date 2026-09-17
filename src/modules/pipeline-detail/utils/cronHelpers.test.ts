import { describeCron, nextCronRuns, splitCronExpression } from './cronHelpers'

describe('splitCronExpression', () => {
    it('parses a valid 5-field expression', () => {
        expect(splitCronExpression('0 2 * * *')).toEqual({
            fields: ['0', '2', '*', '*', '*'],
            valid: true,
        })
    })

    it('rejects empty or wrong field count', () => {
        expect(splitCronExpression('')).toEqual({ fields: [], valid: false })
        expect(splitCronExpression('0 2 * *')).toEqual({
            fields: ['0', '2', '*', '*'],
            valid: false,
        })
    })
})

describe('describeCron', () => {
    it('returns invalid message for bad expressions', () => {
        expect(describeCron('not cron')).toMatch(/Invalid/)
    })

    it('returns next-run text for valid cron', () => {
        const msg = describeCron('0 2 * * *', 'UTC')
        expect(msg.length).toBeGreaterThan(0)
        expect(msg).not.toMatch(/Invalid/)
    })
})

describe('nextCronRuns', () => {
    it('returns up to n future runs for valid cron', () => {
        const runs = nextCronRuns('0 2 * * *', 'UTC', 3)
        expect(runs).toHaveLength(3)
        expect(runs[0].iso).toMatch(/^\d{4}-/)
        expect(runs[0].local).toBeTruthy()
        expect(runs[0].relative).toBeTruthy()
    })

    it('returns empty for invalid cron', () => {
        expect(nextCronRuns('bad', 'UTC', 3)).toEqual([])
    })
})
