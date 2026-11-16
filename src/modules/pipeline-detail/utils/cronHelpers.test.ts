import {
    buildCron,
    describeCron,
    describeScheduleInWords,
    formatTime,
    nextCronRuns,
    parseSimpleSchedule,
    parseTime,
    scheduleOfKind,
    splitCronExpression,
} from './cronHelpers'

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

describe('simple schedules', () => {
    it('reads the shapes the picker builds', () => {
        expect(parseSimpleSchedule('15 * * * *')).toEqual({
            kind: 'hourly',
            minute: 15,
        })
        expect(parseSimpleSchedule('0 6 * * *')).toEqual({
            kind: 'daily',
            hour: 6,
            minute: 0,
        })
        expect(parseSimpleSchedule('0 6 * * 1-5')).toEqual({
            kind: 'weekly',
            days: [1, 2, 3, 4, 5],
            hour: 6,
            minute: 0,
        })
        expect(parseSimpleSchedule('30 2 * * 0,6')).toEqual({
            kind: 'weekly',
            days: [6, 0],
            hour: 2,
            minute: 30,
        })
        expect(parseSimpleSchedule('0 6 1 * *')).toEqual({
            kind: 'monthly',
            day: 1,
            hour: 6,
            minute: 0,
        })
    })

    it('leaves anything else to Custom', () => {
        expect(parseSimpleSchedule('*/15 9-17 * * 1-5')).toBeNull()
        expect(parseSimpleSchedule('0 6 1 1 *')).toBeNull()
        expect(parseSimpleSchedule('0 6 1 * 1')).toBeNull()
        expect(parseSimpleSchedule('nonsense')).toBeNull()
    })

    it('treats all seven weekdays as every day', () => {
        expect(parseSimpleSchedule('0 6 * * 0-6')?.kind).toBe('daily')
    })

    it('builds cron, joining runs of weekdays', () => {
        expect(
            buildCron({
                kind: 'weekly',
                days: [5, 1, 2, 3, 4],
                hour: 6,
                minute: 0,
            })
        ).toBe('0 6 * * 1-5')
        expect(
            buildCron({ kind: 'weekly', days: [1, 4], hour: 6, minute: 0 })
        ).toBe('0 6 * * 1,4')
        expect(
            buildCron({ kind: 'monthly', day: 15, hour: 2, minute: 30 })
        ).toBe('30 2 15 * *')
    })

    it('keeps the time when switching kind', () => {
        expect(
            scheduleOfKind('weekly', { kind: 'daily', hour: 8, minute: 30 })
        ).toEqual({ kind: 'weekly', days: [1], hour: 8, minute: 30 })
    })

    it('says what a schedule means in words', () => {
        expect(describeScheduleInWords('0 * * * *')).toBe(
            'Every hour, on the hour'
        )
        expect(describeScheduleInWords('0 6 * * *')).toBe('Every day at 06:00')
        expect(describeScheduleInWords('0 6 * * 1,4')).toBe(
            'Every Monday and Thursday at 06:00'
        )
        expect(describeScheduleInWords('0 6 * * 1-5')).toBe(
            'Every weekday (Monday to Friday) at 06:00'
        )
        expect(describeScheduleInWords('0 6 1 * *')).toBe(
            'On day 1 of every month at 06:00'
        )
        expect(describeScheduleInWords('*/15 * * * *')).toMatch(/Custom/)
    })

    it('reads times typed in the time field', () => {
        expect(parseTime('06:30')).toEqual({ hour: 6, minute: 30 })
        expect(parseTime('25:00')).toBeNull()
        expect(formatTime(6, 5)).toBe('06:05')
    })
})

describe('describeCron escaping', () => {
    it('shows the timezone with a plain slash', () => {
        expect(describeCron('0 2 * * *', 'Europe/Oslo')).toContain(
            '(Europe/Oslo)'
        )
    })
})
