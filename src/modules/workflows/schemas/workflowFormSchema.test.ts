import {
    defaultWorkflowFormValues,
    workflowFormSchema,
    workflowFormValuesToCreateBody,
    workflowFormValuesToUpdateBody,
    workflowToFormValues,
    type WorkflowFormValues,
} from './workflowFormSchema'

function values(overrides: Partial<WorkflowFormValues> = {}) {
    return {
        ...defaultWorkflowFormValues,
        name: 'Malawi monthly',
        ...overrides,
    }
}

function issuePaths(input: WorkflowFormValues): string[] {
    const result = workflowFormSchema.safeParse(input)
    return result.success
        ? []
        : result.error.issues.map((issue) => issue.path.join('.'))
}

describe('workflowFormSchema', () => {
    it('needs a name', () => {
        expect(issuePaths(values({ name: ' ' }))).toEqual(['name'])
    })

    it('checks the cron only when the workflow is scheduled', () => {
        expect(issuePaths(values({ cronExpression: 'nope' }))).toEqual([])
        expect(
            issuePaths(values({ scheduled: true, cronExpression: 'nope' }))
        ).toEqual(['cronExpression'])
        expect(
            issuePaths(values({ scheduled: true, cronExpression: '0 6 1 * *' }))
        ).toEqual([])
    })
})

describe('workflow <-> form values', () => {
    it('sends a schedule only when it is switched on', () => {
        expect(
            workflowFormValuesToCreateBody(
                values({ scheduled: true, cronExpression: ' 0 6 1 * * ' })
            )
        ).toEqual({
            name: 'Malawi monthly',
            description: undefined,
            isActive: true,
            cronExpr: '0 6 1 * *',
        })
        expect(workflowFormValuesToUpdateBody(values()).cronExpr).toBeNull()
    })

    it('opens a scheduled workflow with its cron', () => {
        const form = workflowToFormValues({
            id: 'w',
            name: 'Malawi monthly',
            description: null,
            isActive: true,
            cronExpr: '0 6 * * 1',
            template: null,
            lastRunAt: null,
            nextRunAt: null,
            createdAt: '',
            updatedAt: '',
        })
        expect(form).toMatchObject({
            scheduled: true,
            cronExpression: '0 6 * * 1',
            description: '',
        })
    })
})
