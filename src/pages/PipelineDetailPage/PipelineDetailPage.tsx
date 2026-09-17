import { useDataEngine } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import { Button, CircularLoader, NoticeBox, Tab, TabBar } from '@dhis2/ui'
import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { DeletePipelineModal } from './components/DeletePipelineModal'
import { DeleteScheduleModal } from './components/DeleteScheduleModal'
import { DeleteStepModal } from './components/DeleteStepModal'
import { PipelineDetailHeader } from './components/PipelineDetailHeader'
import { PipelineExecutionsTab } from './components/PipelineExecutionsTab'
import { PipelineOverviewTab } from './components/PipelineOverviewTab'
import { PipelineSchedulesTab } from './components/PipelineSchedulesTab'
import { PipelineStepsTab } from './components/PipelineStepsTab'
import classes from './PipelineDetailPage.module.css'
import { CapsApiError } from '@/capsApi/client'
import { isUuid } from '@/capsApi/isUuid'
import { paginationToPageCount } from '@/capsApi/types'
import { useHandlersQuery } from '@/modules/handlers/hooks/useHandlersQuery'
import {
    usePipelineDetailQuery,
    usePipelineExecutionsTabQuery,
} from '@/modules/monitoring/hooks/capsMonitoringHooks'
import { PipelineAddScheduleModal } from '@/modules/pipeline-detail/components/PipelineAddScheduleModal'
import { PipelineAddStepModal } from '@/modules/pipeline-detail/components/PipelineAddStepModal'
import { PipelineEditScheduleModal } from '@/modules/pipeline-detail/components/PipelineEditScheduleModal'
import { PipelineEditStepModal } from '@/modules/pipeline-detail/components/PipelineEditStepModal'
import { PipelineTriggerContextModal } from '@/modules/pipeline-detail/components/PipelineTriggerContextModal'
import { usePipelinePageMutations } from '@/modules/pipeline-detail/hooks/usePipelinePageMutations'
import { useScheduleMutations } from '@/modules/pipeline-detail/hooks/useScheduleMutations'
import { useStepMutations } from '@/modules/pipeline-detail/hooks/useStepMutations'
import { useTriggerPipeline } from '@/modules/pipeline-detail/hooks/useTriggerPipeline'
import { PipelineEditModal } from '@/modules/pipelines/components/PipelineEditModal'
import shellClasses from '@/shared/components/ui/PageShell/PageShell.module.css'
import type { PipelineSchedule, PipelineStep } from '@/shared/types/caps'

type TabKey = 'overview' | 'steps' | 'schedules' | 'executions'

const PipelineDetailPage: React.FC = () => {
    const engine = useDataEngine()
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState<TabKey>('overview')
    const [showAddStep, setShowAddStep] = useState(false)
    const [showAddSchedule, setShowAddSchedule] = useState(false)
    const [showTriggerContext, setShowTriggerContext] = useState(false)
    const [execStatusFilter, setExecStatusFilter] = useState('')
    const [execPage, setExecPage] = useState(1)
    const [execPageSize, setExecPageSize] = useState(20)
    const [showDeletePipeline, setShowDeletePipeline] = useState(false)

    const [showEditPipeline, setShowEditPipeline] = useState(false)
    const [deletePipelineError, setDeletePipelineError] = useState<
        string | null
    >(null)

    const [editStep, setEditStep] = useState<PipelineStep | null>(null)
    const [deleteStepTarget, setDeleteStepTarget] =
        useState<PipelineStep | null>(null)
    const [deleteStepError, setDeleteStepError] = useState<string | null>(null)

    const [editSchedule, setEditSchedule] = useState<PipelineSchedule | null>(
        null
    )
    const [deleteScheduleTarget, setDeleteScheduleTarget] =
        useState<PipelineSchedule | null>(null)
    const [deleteScheduleError, setDeleteScheduleError] = useState<
        string | null
    >(null)

    const idReady = isUuid(id)

    const { handleTrigger, triggerLoading, triggerError } = useTriggerPipeline(
        id,
        (executionId) => navigate(`/executions/${executionId}`)
    )

    const {
        data: pipelineDetail,
        isLoading: pipelineLoading,
        isError: pipelineIsError,
        error: pipelineError,
    } = usePipelineDetailQuery(engine, id, idReady)

    const {
        data: handlers,
        isLoading: handlersLoading,
        error: handlersQueryError,
    } = useHandlersQuery(engine)

    const { data: execData, isLoading: execLoading } =
        usePipelineExecutionsTabQuery(engine, {
            id,
            idReady,
            execStatusFilter,
            execPage,
            execPageSize,
        })

    const { deletePipelineMutation } = usePipelinePageMutations({
        engine,
        pipelineId: id,
        onEditSuccess: () => setShowEditPipeline(false),
        onDeleteSuccess: () => navigate('/pipelines'),
        onDeleteError: setDeletePipelineError,
    })

    const {
        createStepMutation,
        updateStepMutation,
        deleteStepMutation,
        handleStepReorder,
        reorderError,
    } = useStepMutations({
        engine,
        pipelineId: id,
        deleteStepTargetId: deleteStepTarget?.id,
        onCreateSuccess: () => setShowAddStep(false),
        onUpdateSuccess: () => setEditStep(null),
        onDeleteSuccess: () => setDeleteStepTarget(null),
        onDeleteError: setDeleteStepError,
    })

    const {
        handleCreateSchedule,
        pauseScheduleMutation,
        resumeScheduleMutation,
        updateScheduleMutation,
        deleteScheduleMutation,
        scheduleActionError,
        setScheduleActionError,
    } = useScheduleMutations({
        engine,
        pipelineId: id,
        deleteScheduleTargetId: deleteScheduleTarget?.id,
        onUpdateSuccess: () => setEditSchedule(null),
        onDeleteSuccess: () => setDeleteScheduleTarget(null),
        onDeleteError: setDeleteScheduleError,
    })

    if (!idReady) {
        return (
            <div className={shellClasses.pageRoot}>
                <NoticeBox error title={i18n.t('Invalid pipeline')}>
                    {i18n.t('The pipeline link is not a valid identifier.')}
                </NoticeBox>
                <Button onClick={() => navigate('/pipelines')}>
                    {i18n.t('Back to pipelines')}
                </Button>
            </div>
        )
    }

    if (pipelineLoading && !pipelineDetail) {
        return (
            <div className={shellClasses.pageRoot}>
                <CircularLoader />
            </div>
        )
    }

    if (pipelineIsError && pipelineError instanceof CapsApiError) {
        return (
            <div className={shellClasses.pageRoot}>
                <NoticeBox error title={i18n.t('Could not load pipeline')}>
                    {pipelineError.message}
                </NoticeBox>
                <Button onClick={() => navigate('/pipelines')}>
                    {i18n.t('Back to pipelines')}
                </Button>
            </div>
        )
    }

    if (!pipelineDetail) {
        return null
    }

    const pipeline = pipelineDetail
    const steps = [...(pipeline.steps ?? [])].sort(
        (a, b) => a.stepOrder - b.stepOrder
    )
    const schedules = pipeline.schedules ?? []
    const filteredExecutions = execData?.executions ?? []
    const execPagination = execData?.pagination
    const execPageCount = execPagination
        ? paginationToPageCount(execPagination)
        : 1
    const execTotal = execPagination?.total ?? 0

    return (
        <div className={shellClasses.pageRoot}>
            <PipelineDetailHeader
                pipeline={pipeline}
                triggerLoading={triggerLoading}
                triggerError={triggerError}
                onNavigateBack={() => navigate('/pipelines')}
                onTrigger={() => void handleTrigger()}
                onTriggerWithContext={() => setShowTriggerContext(true)}
                onEdit={() => setShowEditPipeline(true)}
                onDelete={() => setShowDeletePipeline(true)}
            />

            <TabBar>
                <Tab
                    selected={activeTab === 'overview'}
                    onClick={() => setActiveTab('overview')}
                >
                    {i18n.t('Overview')}
                </Tab>
                <Tab
                    selected={activeTab === 'steps'}
                    onClick={() => setActiveTab('steps')}
                >
                    {i18n.t('Steps ({{count}})', {
                        count: steps.length,
                    })}
                </Tab>
                <Tab
                    selected={activeTab === 'schedules'}
                    onClick={() => setActiveTab('schedules')}
                >
                    {i18n.t('Schedules ({{count}})', {
                        count: schedules.length,
                    })}
                </Tab>
                <Tab
                    selected={activeTab === 'executions'}
                    onClick={() => setActiveTab('executions')}
                >
                    {i18n.t('Executions')}
                </Tab>
            </TabBar>

            <div className={classes.tabContent}>
                {activeTab === 'overview' && (
                    <PipelineOverviewTab pipeline={pipeline} />
                )}

                {activeTab === 'steps' && (
                    <PipelineStepsTab
                        steps={steps}
                        handlers={handlers}
                        reorderError={reorderError}
                        onAddStep={() => setShowAddStep(true)}
                        onEditStep={setEditStep}
                        onDeleteStep={(step) => {
                            setDeleteStepTarget(step)
                            setDeleteStepError(null)
                        }}
                        onReorder={(fromIndex, toIndex) =>
                            void handleStepReorder(steps, fromIndex, toIndex)
                        }
                    />
                )}

                {activeTab === 'schedules' && (
                    <PipelineSchedulesTab
                        schedules={schedules}
                        scheduleActionError={scheduleActionError}
                        pauseDisabled={pauseScheduleMutation.isPending}
                        resumeDisabled={resumeScheduleMutation.isPending}
                        onAddSchedule={() => setShowAddSchedule(true)}
                        onEditSchedule={setEditSchedule}
                        onPauseSchedule={(schedule) => {
                            setScheduleActionError(null)
                            pauseScheduleMutation.mutate(schedule.id)
                        }}
                        onResumeSchedule={(schedule) => {
                            setScheduleActionError(null)
                            resumeScheduleMutation.mutate(schedule.id)
                        }}
                        onDeleteSchedule={(schedule) => {
                            setDeleteScheduleTarget(schedule)
                            setDeleteScheduleError(null)
                        }}
                    />
                )}

                {activeTab === 'executions' && (
                    <PipelineExecutionsTab
                        executions={filteredExecutions}
                        isLoading={execLoading}
                        hasLoadedOnce={Boolean(execData)}
                        statusFilter={execStatusFilter}
                        page={execPage}
                        pageCount={execPageCount}
                        pageSize={execPageSize}
                        total={execTotal}
                        onStatusFilterChange={(status) => {
                            setExecStatusFilter(status)
                            setExecPage(1)
                        }}
                        onPageChange={setExecPage}
                        onPageSizeChange={(size) => {
                            setExecPageSize(size)
                            setExecPage(1)
                        }}
                    />
                )}
            </div>

            <PipelineAddStepModal
                open={showAddStep}
                onClose={() => setShowAddStep(false)}
                pipelineName={pipeline?.name}
                defaultStepOrder={steps.length}
                createStepMutation={createStepMutation}
                handlers={handlers}
                handlersLoading={handlersLoading}
                handlersError={
                    handlersQueryError instanceof Error
                        ? handlersQueryError
                        : null
                }
            />

            <PipelineEditStepModal
                step={editStep}
                open={editStep !== null}
                onClose={() => setEditStep(null)}
                pipelineName={pipeline?.name}
                updateStepMutation={updateStepMutation}
                handlers={handlers}
                handlersLoading={handlersLoading}
                handlersError={
                    handlersQueryError instanceof Error
                        ? handlersQueryError
                        : null
                }
            />

            {deleteStepTarget && (
                <DeleteStepModal
                    step={deleteStepTarget}
                    error={deleteStepError}
                    isPending={deleteStepMutation.isPending}
                    onClose={() => {
                        setDeleteStepTarget(null)
                        setDeleteStepError(null)
                    }}
                    onConfirm={() => deleteStepMutation.mutate()}
                />
            )}

            <PipelineAddScheduleModal
                open={showAddSchedule}
                onClose={() => setShowAddSchedule(false)}
                pipelineName={pipeline?.name}
                steps={steps}
                handlers={handlers ?? []}
                handlersLoading={handlersLoading}
                onSubmitValid={handleCreateSchedule}
            />

            <PipelineEditScheduleModal
                schedule={editSchedule}
                open={editSchedule !== null}
                onClose={() => setEditSchedule(null)}
                pipelineName={pipeline?.name}
                steps={steps}
                handlers={handlers ?? []}
                handlersLoading={handlersLoading}
                updateScheduleMutation={updateScheduleMutation}
            />

            {deleteScheduleTarget && (
                <DeleteScheduleModal
                    schedule={deleteScheduleTarget}
                    error={deleteScheduleError}
                    isPending={deleteScheduleMutation.isPending}
                    onClose={() => {
                        setDeleteScheduleTarget(null)
                        setDeleteScheduleError(null)
                    }}
                    onConfirm={() => deleteScheduleMutation.mutate()}
                />
            )}

            <PipelineTriggerContextModal
                open={showTriggerContext}
                onClose={() => setShowTriggerContext(false)}
                pipelineName={pipeline?.name}
                steps={steps}
                handlers={handlers ?? []}
                handlersLoading={handlersLoading}
                loading={triggerLoading}
                onConfirm={async (context) => {
                    await handleTrigger(context as Record<string, unknown>)
                }}
            />

            <PipelineEditModal
                pipeline={pipeline}
                open={showEditPipeline}
                onClose={() => setShowEditPipeline(false)}
            />

            {showDeletePipeline && (
                <DeletePipelineModal
                    pipelineName={pipeline.name}
                    error={deletePipelineError}
                    isPending={deletePipelineMutation.isPending}
                    onClose={() => {
                        setShowDeletePipeline(false)
                        setDeletePipelineError(null)
                    }}
                    onConfirm={() => deletePipelineMutation.mutate()}
                />
            )}
        </div>
    )
}

export default PipelineDetailPage
