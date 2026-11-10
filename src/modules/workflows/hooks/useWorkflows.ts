import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CapsDataEngine } from '@/capsApi/client'
import {
    addWorkflowPipeline,
    createMerge,
    createWorkflowFromTemplate,
    getWorkflowTemplateSetup,
    listWorkflowTemplates,
    previewWorkflowTemplate,
    updateWorkflowTemplateSetup,
    createWorkflow,
    deleteMerge,
    deleteWorkflow,
    duplicatePipeline,
    getWorkflow,
    getWorkflowRun,
    listWorkflowRuns,
    listWorkflows,
    removeWorkflowPipeline,
    runWorkflow,
    updateMerge,
    updateWorkflow,
} from '@/capsApi/endpoints'
import { capsKeys } from '@/capsApi/queryKeys'
import type {
    CreateMergeBody,
    CreateWorkflowBody,
    CreateWorkflowFromTemplateBody,
    UpdateWorkflowTemplateSetupBody,
    UpdateMergeBody,
    UpdateWorkflowBody,
} from '@/capsApi/types'
import type {
    ClimatePredictionParams,
    RunPeriodRange,
} from '@/shared/types/caps'

/** Refresh while something may still change, so status settles without a reload. */
const LIVE_REFETCH_MS = 5000

export function useWorkflowsQuery(engine: CapsDataEngine) {
    return useQuery({
        queryKey: capsKeys.workflows.list(),
        queryFn: () => listWorkflows(engine),
    })
}

export function useWorkflowQuery(
    engine: CapsDataEngine,
    id: string | undefined
) {
    return useQuery({
        queryKey: capsKeys.workflows.detail(id),
        queryFn: () => getWorkflow(engine, id!),
        enabled: Boolean(id),
    })
}

export function useWorkflowRunsQuery(
    engine: CapsDataEngine,
    id: string | undefined,
    { page, pageSize }: { page: number; pageSize: number }
) {
    return useQuery({
        queryKey: capsKeys.workflows.runs(id, page, pageSize),
        queryFn: () => listWorkflowRuns(engine, id!, { page, pageSize }),
        enabled: Boolean(id),
        refetchInterval: (data) =>
            data?.items.some((run) => run.status === 'RUNNING')
                ? LIVE_REFETCH_MS
                : false,
    })
}

export function useWorkflowRunQuery(
    engine: CapsDataEngine,
    runId: string | undefined
) {
    return useQuery({
        queryKey: capsKeys.workflows.run(runId),
        queryFn: () => getWorkflowRun(engine, runId!),
        enabled: Boolean(runId),
        refetchInterval: (data) =>
            data?.status === 'RUNNING' ? LIVE_REFETCH_MS : false,
    })
}

export function useWorkflowMutations(engine: CapsDataEngine) {
    const queryClient = useQueryClient()
    const invalidateWorkflows = () =>
        queryClient.invalidateQueries({ queryKey: capsKeys.workflows.all() })
    // Membership shows on pipeline pages too
    const invalidateWorkflowsAndPipelines = async () => {
        await invalidateWorkflows()
        await queryClient.invalidateQueries({
            queryKey: capsKeys.pipelines.all(),
        })
        await queryClient.invalidateQueries({
            queryKey: [...capsKeys.all, 'pipeline'],
        })
    }

    const createWorkflowMutation = useMutation({
        mutationFn: (body: CreateWorkflowBody) => createWorkflow(engine, body),
        onSuccess: invalidateWorkflows,
    })

    const updateWorkflowMutation = useMutation({
        mutationFn: ({ id, body }: { id: string; body: UpdateWorkflowBody }) =>
            updateWorkflow(engine, id, body),
        onSuccess: invalidateWorkflows,
    })

    const deleteWorkflowMutation = useMutation({
        mutationFn: (id: string) => deleteWorkflow(engine, id),
        onSuccess: invalidateWorkflowsAndPipelines,
    })

    const addPipelineMutation = useMutation({
        mutationFn: ({ id, pipelineId }: { id: string; pipelineId: string }) =>
            addWorkflowPipeline(engine, id, pipelineId),
        onSuccess: invalidateWorkflowsAndPipelines,
    })

    const removePipelineMutation = useMutation({
        mutationFn: ({ id, pipelineId }: { id: string; pipelineId: string }) =>
            removeWorkflowPipeline(engine, id, pipelineId),
        onSuccess: invalidateWorkflowsAndPipelines,
    })

    const runWorkflowMutation = useMutation({
        mutationFn: ({ id, period }: { id: string; period?: RunPeriodRange }) =>
            runWorkflow(engine, id, period ? { period } : undefined),
        onSuccess: async () => {
            await invalidateWorkflows()
            await queryClient.invalidateQueries({
                queryKey: capsKeys.executions.all(),
            })
        },
    })

    return {
        createWorkflowMutation,
        updateWorkflowMutation,
        deleteWorkflowMutation,
        addPipelineMutation,
        removePipelineMutation,
        runWorkflowMutation,
    }
}

export function useMergeMutations(engine: CapsDataEngine) {
    const queryClient = useQueryClient()
    const invalidateWorkflows = () =>
        queryClient.invalidateQueries({ queryKey: capsKeys.workflows.all() })

    const createMergeMutation = useMutation({
        mutationFn: (body: CreateMergeBody) => createMerge(engine, body),
        onSuccess: invalidateWorkflows,
    })
    const updateMergeMutation = useMutation({
        mutationFn: ({ id, body }: { id: string; body: UpdateMergeBody }) =>
            updateMerge(engine, id, body),
        onSuccess: invalidateWorkflows,
    })
    const deleteMergeMutation = useMutation({
        mutationFn: (id: string) => deleteMerge(engine, id),
        onSuccess: invalidateWorkflows,
    })

    return { createMergeMutation, updateMergeMutation, deleteMergeMutation }
}

export function useDuplicatePipelineMutation(engine: CapsDataEngine) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, name }: { id: string; name: string }) =>
            duplicatePipeline(engine, id, { name }),
        onSuccess: () =>
            queryClient.invalidateQueries({
                queryKey: capsKeys.pipelines.all(),
            }),
    })
}

export function useWorkflowTemplatesQuery(engine: CapsDataEngine) {
    return useQuery({
        queryKey: capsKeys.workflows.templates(),
        queryFn: () => listWorkflowTemplates(engine),
        staleTime: Infinity,
    })
}

/** Template and parameters a workflow was made from; only for workflows made from one. */
export function useWorkflowTemplateSetupQuery(
    engine: CapsDataEngine,
    id: string | undefined,
    enabled = true
) {
    return useQuery({
        queryKey: capsKeys.workflows.templateSetup(id),
        queryFn: () => getWorkflowTemplateSetup(engine, id!),
        enabled: Boolean(id) && enabled,
    })
}

/**
 * Checks parameters on the engine as they are typed: CHAP setup, staging data elements,
 * OCS datasets and the source route. Pass null while the form itself is incomplete.
 */
export function useTemplatePreviewQuery(
    engine: CapsDataEngine,
    template: string,
    params: ClimatePredictionParams | null
) {
    return useQuery({
        queryKey: capsKeys.workflows.templatePreview(template, params),
        queryFn: () => previewWorkflowTemplate(engine, template, params!),
        enabled: params !== null,
        keepPreviousData: true,
        staleTime: 30_000,
    })
}

export function useTemplateMutations(engine: CapsDataEngine) {
    const queryClient = useQueryClient()
    const invalidate = async () => {
        await queryClient.invalidateQueries({
            queryKey: capsKeys.workflows.all(),
        })
        await queryClient.invalidateQueries({
            queryKey: capsKeys.pipelines.all(),
        })
    }

    const createFromTemplateMutation = useMutation({
        mutationFn: ({
            template,
            body,
        }: {
            template: string
            body: CreateWorkflowFromTemplateBody
        }) => createWorkflowFromTemplate(engine, template, body),
        onSuccess: invalidate,
    })

    const updateSetupMutation = useMutation({
        mutationFn: ({
            id,
            body,
        }: {
            id: string
            body: UpdateWorkflowTemplateSetupBody
        }) => updateWorkflowTemplateSetup(engine, id, body),
        onSuccess: invalidate,
    })

    return { createFromTemplateMutation, updateSetupMutation }
}
