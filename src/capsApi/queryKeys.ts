export type CapsExecutionsListKeyParams = {
    pipelineId: string | undefined
    status: string
    page: number
    pageSize: number
}

export const capsKeys = {
    all: ['caps'] as const,

    dashboard: () => [...capsKeys.all, 'dashboard'] as const,

    systemInfo: () => [...capsKeys.all, 'system-info'] as const,

    evaluations: () => [...capsKeys.all, 'evaluations'] as const,

    predictionSetup: (id: number | undefined) =>
        [...capsKeys.all, 'prediction-setup', id] as const,

    handlers: {
        all: () => [...capsKeys.all, 'handlers'] as const,
    },

    instances: {
        /** Prefix match: invalidates every instance query. */
        all: () => [...capsKeys.all, 'instances'] as const,
        list: () => [...capsKeys.instances.all(), 'list'] as const,
        detail: (routeCode: string | undefined) =>
            [...capsKeys.instances.all(), 'detail', routeCode] as const,
        allMappings: () =>
            [...capsKeys.instances.all(), 'all-mappings'] as const,
    },

    pipelines: {
        all: () => [...capsKeys.all, 'pipelines'] as const,
        list: (page: number, pageSize: number) =>
            [...capsKeys.pipelines.all(), 'list', page, pageSize] as const,
        filterOptions: () =>
            [...capsKeys.pipelines.all(), 'filter-options'] as const,
        deadLetterFilters: () =>
            [...capsKeys.pipelines.all(), 'dead-letter-filters'] as const,
    },

    pipeline: {
        detail: (id: string | undefined) =>
            [...capsKeys.all, 'pipeline', id] as const,
    },

    connectors: {
        /** Prefix match: invalidates every connectors query. */
        all: () => [...capsKeys.all, 'connectors'] as const,
        runs: (connectorId: string, page: number, pageSize: number) =>
            [
                ...capsKeys.connectors.all(),
                'runs',
                connectorId,
                page,
                pageSize,
            ] as const,
    },

    workflows: {
        all: () => [...capsKeys.all, 'workflows'] as const,
        list: () => [...capsKeys.workflows.all(), 'list'] as const,
        detail: (id: string | undefined) =>
            [...capsKeys.workflows.all(), 'detail', id] as const,
        runs: (id: string | undefined, page: number, pageSize: number) =>
            [...capsKeys.workflows.all(), 'runs', id, page, pageSize] as const,
        run: (runId: string | undefined) =>
            [...capsKeys.workflows.all(), 'run', runId] as const,
        templateSetup: (id: string | undefined) =>
            [...capsKeys.workflows.all(), 'template', id] as const,
        templates: () => [...capsKeys.workflows.all(), 'templates'] as const,
        templatePreview: (template: string, params: unknown) =>
            [...capsKeys.workflows.all(), 'preview', template, params] as const,
    },

    executions: {
        /** Prefix match: invalidates every executions list query. */
        all: () => [...capsKeys.all, 'executions'] as const,
        list: (p: CapsExecutionsListKeyParams) =>
            [
                ...capsKeys.executions.all(),
                p.pipelineId,
                p.status,
                p.page,
                p.pageSize,
            ] as const,
        /** Prefix match: invalidates all execution lists for a pipeline. */
        byPipeline: (pipelineId: string) =>
            [...capsKeys.executions.all(), pipelineId] as const,
    },

    execution: {
        detail: (id: string | undefined) =>
            [...capsKeys.all, 'execution', id] as const,
    },

    deadLetters: {
        list: (p: { pipelineId: string; page: number; pageSize: number }) =>
            [
                ...capsKeys.all,
                'dead-letters',
                p.pipelineId,
                p.page,
                p.pageSize,
            ] as const,
    },

    analytics: {
        trends: (days: number) =>
            [...capsKeys.all, 'analytics', 'trends', days] as const,
        topFailingSteps: (days: number) =>
            [...capsKeys.all, 'analytics', 'top-failing-steps', days] as const,
        durations: (days: number) =>
            [...capsKeys.all, 'analytics', 'durations', days] as const,
        topErrors: (days: number) =>
            [...capsKeys.all, 'analytics', 'top-errors', days] as const,
    },

    climateCollections: {
        all: () => [...capsKeys.all, 'climate-collections'] as const,
        list: () => [...capsKeys.climateCollections.all(), 'list'] as const,
        detail: (id: string | undefined) =>
            [...capsKeys.climateCollections.all(), 'detail', id] as const,
    },
    climateDataSources: {
        all: () => [...capsKeys.all, 'climate-data-sources'] as const,
        list: () => [...capsKeys.climateDataSources.all(), 'list'] as const,
        detail: (id: string | undefined) =>
            [...capsKeys.climateDataSources.all(), 'detail', id] as const,
    },
    climateJobs: {
        active: () => [...capsKeys.all, 'climate-jobs-active'] as const,
        detail: (jobId: string | undefined) =>
            [...capsKeys.all, 'climate-jobs', jobId] as const,
    },
    climateSyncPlans: {
        detail: (datasetId: string | undefined) =>
            [...capsKeys.all, 'climate-sync-plans', datasetId] as const,
    },
} as const
