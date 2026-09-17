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

    models: () => [...capsKeys.all, 'models'] as const,

    handlers: {
        all: () => [...capsKeys.all, 'handlers'] as const,
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

    climateDatasets: {
        all: () => [...capsKeys.all, 'climate-datasets'] as const,
        list: () => [...capsKeys.climateDatasets.all(), 'list'] as const,
        detail: (id: string | undefined) =>
            [...capsKeys.all, 'climate-datasets', id] as const,
    },
    climateTemplates: {
        all: () => [...capsKeys.all, 'climate-templates'] as const,
        list: () => [...capsKeys.climateTemplates.all(), 'list'] as const,
        detail: (id: string | undefined) =>
            [...capsKeys.climateTemplates.all(), 'detail', id] as const,
    },
    climateJobs: {
        detail: (jobId: string | undefined) =>
            [...capsKeys.all, 'climate-jobs', jobId] as const,
    },
    climateSyncPlans: {
        detail: (datasetId: string | undefined) =>
            [...capsKeys.all, 'climate-sync-plans', datasetId] as const,
    },
} as const
