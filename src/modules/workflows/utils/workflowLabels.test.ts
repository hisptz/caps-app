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

    it('shows the cron and the next run without HTML-escaping the date', () => {
        const label = describeWorkflowSchedule({
            cronExpr: '0 6 1 * *',
            nextRunAt: '2026-11-01T06:00:00Z',
            isActive: true,
        })
        expect(label).toContain('0 6 1 * *')
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
        ).toBe('0 6 1 * *')
    })
})

describe('formatWorkflowTrigger', () => {
    it('names what started a run', () => {
        expect(formatWorkflowTrigger('scheduler')).toBe('Schedule')
        expect(formatWorkflowTrigger('api')).toBe('Trigger button')
    })
})
