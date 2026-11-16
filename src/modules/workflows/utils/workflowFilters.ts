import type { Workflow } from '@/shared/types/caps'

export type WorkflowActiveFilter = 'all' | 'active' | 'inactive'

/** A latest-execution status, or NEVER for workflows that have not run */
export type WorkflowLastRunFilter =
    | 'any'
    | 'RUNNING'
    | 'COMPLETED'
    | 'FAILED'
    | 'CANCELLED'
    | 'NEVER'

export type WorkflowFilters = {
    search: string
    active: WorkflowActiveFilter
    lastRun: WorkflowLastRunFilter
}

export const NO_WORKFLOW_FILTERS: WorkflowFilters = {
    search: '',
    active: 'all',
    lastRun: 'any',
}

export function hasWorkflowFilters(filters: WorkflowFilters): boolean {
    return (
        filters.search.trim() !== '' ||
        filters.active !== 'all' ||
        filters.lastRun !== 'any'
    )
}

type FilterableWorkflow = Pick<
    Workflow,
    'name' | 'description' | 'isActive'
> & {
    latestRun: { status: string } | null
}

/** Workflows matching the search text (name or description), status and last result. */
export function filterWorkflows<T extends FilterableWorkflow>(
    workflows: T[],
    filters: WorkflowFilters
): T[] {
    const q = filters.search.trim().toLowerCase()
    return workflows.filter((workflow) => {
        if (
            q &&
            !workflow.name.toLowerCase().includes(q) &&
            !(workflow.description ?? '').toLowerCase().includes(q)
        ) {
            return false
        }
        if (filters.active === 'active' && !workflow.isActive) {
            return false
        }
        if (filters.active === 'inactive' && workflow.isActive) {
            return false
        }
        if (filters.lastRun === 'NEVER') {
            return workflow.latestRun === null
        }
        if (filters.lastRun !== 'any') {
            return workflow.latestRun?.status === filters.lastRun
        }
        return true
    })
}
