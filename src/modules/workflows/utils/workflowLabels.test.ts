import {
    describeWorkflowSchedule,
    formatWorkflowTrigger,
} from './workflowLabels'

describe('describeWorkflowSchedule', () => {
    it('says when a workflow is only started by hand', () => {
        expect(
            describeWorkflowSchedule({
                cronExpr: null,
                nextRunAt: null,
                isActive: true,
            })
        ).toBe('Started by hand only')
    })

    it('says how often it runs and the next run, without the cron or HTML-escaping', () => {
        const label = describeWorkflowSchedule({
            cronExpr: '0 6 1 * *',
            nextRunAt: '2026-11-01T06:00:00Z',
            isActive: true,
        })
        expect(label).toContain('On day 1 of every month')
        expect(label).not.toContain('0 6 1 * *')
        expect(label).toContain(
            new Date('2026-11-01T06:00:00Z').toLocaleString()
        )
        expect(label).not.toContain('&#x2F;')
    })

    it('leaves out the next run of an inactive workflow', () => {
        expect(
            describeWorkflowSchedule({
                cronExpr: '0 6 1 * *',
                nextRunAt: '2026-11-01T06:00:00Z',
                isActive: false,
            })
        ).toBe('On day 1 of every month')
    })

    it('names the weekday of a weekly schedule', () => {
        expect(
            describeWorkflowSchedule({
                cronExpr: '0 6 * * 1',
                nextRunAt: null,
                isActive: true,
            })
        ).toBe('Every Monday')
    })
})

describe('formatWorkflowTrigger', () => {
    it('names what started a run', () => {
        expect(formatWorkflowTrigger('scheduler')).toBe('Schedule')
        expect(formatWorkflowTrigger('api')).toBe('Trigger button')
    })
})
