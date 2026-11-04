import {
    defaultMergeFormValues,
    mergeFormSchema,
    mergeFormValuesToCreateBody,
    mergeToFormValues,
    type MergeFormValues,
} from './mergeFormSchema'
import type { PipelineMerge } from '@/shared/types/caps'

function values(overrides: Partial<MergeFormValues> = {}): MergeFormValues {
    return {
        ...defaultMergeFormValues,
        name: 'Both in',
        sourcePipelineIds: ['disease', 'climate'],
        targetPipelineId: 'prediction',
        ...overrides,
    }
}

function issuePaths(input: MergeFormValues): string[] {
    const result = mergeFormSchema.safeParse(input)
    return result.success
        ? []
        : result.error.issues.map((issue) => issue.path.join('.'))
}

describe('mergeFormSchema', () => {
    it('accepts two sources and a different target', () => {
        expect(issuePaths(values())).toEqual([])
    })

    it('needs two sources, a target that is not a source, and whole hours', () => {
        expect(
            issuePaths(
                values({
                    sourcePipelineIds: ['disease'],
                    targetPipelineId: 'disease',
                    timeoutHours: '1.5',
                })
            )
        ).toEqual(['sourcePipelineIds', 'timeoutHours', 'targetPipelineId'])
    })
})

describe('merge <-> form values', () => {
    it('sends hours as minutes and conditions as a rule', () => {
        expect(
            mergeFormValuesToCreateBody(
                values({
                    timeoutHours: '6',
                    triggerRule: 'ALL_DONE',
                    ruleMode: 'conditions',
                    ruleConditions: [
                        {
                            path: 'stepOutputs.s1.count',
                            operator: 'gt',
                            value: '0',
                        },
                    ],
                }),
                'w'
            )
        ).toEqual({
            name: 'Both in',
            description: undefined,
            workflowId: 'w',
            sourcePipelineIds: ['disease', 'climate'],
            targetPipelineId: 'prediction',
            triggerRule: 'ALL_DONE',
            timeoutMinutes: 360,
            condition: { '>': [{ var: 'context.stepOutputs.s1.count' }, 0] },
            isActive: true,
        })
    })

    it('opens a merge with its sources and time limit in hours', () => {
        const form = mergeToFormValues({
            id: 'm',
            name: 'Both in',
            description: null,
            workflowId: 'w',
            targetPipelineId: 'prediction',
            triggerRule: 'ALL_SUCCEEDED',
            timeoutMinutes: 1440,
            condition: null,
            isActive: true,
            createdAt: '',
            updatedAt: '',
            sources: [
                { mergeId: 'm', pipelineId: 'disease' },
                { mergeId: 'm', pipelineId: 'climate' },
            ],
        } as PipelineMerge)
        expect(form).toMatchObject({
            sourcePipelineIds: ['disease', 'climate'],
            timeoutHours: '24',
            ruleMode: 'always',
        })
    })
})
