import {
    filterWorkflows,
    hasWorkflowFilters,
    NO_WORKFLOW_FILTERS,
} from './workflowFilters'

const workflows = [
    {
        name: 'Weekly malaria',
        description: 'Climate then prediction',
        isActive: true,
        latestRun: { status: 'COMPLETED' },
    },
    {
        name: 'HMIS mirror',
        description: null,
        isActive: false,
        latestRun: null,
    },
    {
        name: 'Regional climate',
        description: null,
        isActive: true,
        latestRun: { status: 'FAILED' },
    },
]

const names = (list: typeof workflows) => list.map((w) => w.name)

describe('filterWorkflows', () => {
    it('keeps everything without filters', () => {
        expect(filterWorkflows(workflows, NO_WORKFLOW_FILTERS)).toHaveLength(3)
        expect(hasWorkflowFilters(NO_WORKFLOW_FILTERS)).toBe(false)
    })

    it('searches name and description, ignoring case', () => {
        const filters = { ...NO_WORKFLOW_FILTERS, search: ' CLIMATE ' }
        expect(names(filterWorkflows(workflows, filters))).toEqual([
            'Weekly malaria',
            'Regional climate',
        ])
        expect(hasWorkflowFilters(filters)).toBe(true)
    })

    it('filters by active and inactive', () => {
        expect(
            names(
                filterWorkflows(workflows, {
                    ...NO_WORKFLOW_FILTERS,
                    active: 'inactive',
                })
            )
        ).toEqual(['HMIS mirror'])
    })

    it('filters by the last execution, including never run', () => {
        expect(
            names(
                filterWorkflows(workflows, {
                    ...NO_WORKFLOW_FILTERS,
                    lastRun: 'FAILED',
                })
            )
        ).toEqual(['Regional climate'])
        expect(
            names(
                filterWorkflows(workflows, {
                    ...NO_WORKFLOW_FILTERS,
                    lastRun: 'NEVER',
                })
            )
        ).toEqual(['HMIS mirror'])
    })
})
