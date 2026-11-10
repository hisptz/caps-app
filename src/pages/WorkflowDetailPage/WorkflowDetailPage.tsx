import { useDataEngine } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import {
    Button,
    ButtonStrip,
    IconArrowLeft16,
    IconDelete16,
    IconEdit16,
    FlyoutMenu,
    MenuItem,
    NoticeBox,
    SplitButton,
    Tab,
    TabBar,
} from '@dhis2/ui'
import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { WorkflowFlowTab } from './components/WorkflowFlowTab'
import { WorkflowPipelinesTab } from './components/WorkflowPipelinesTab'
import { WorkflowRunsTab } from './components/WorkflowRunsTab'
import { ActiveTag } from '@/modules/workflows/components/ActiveTag'
import { DeleteWorkflowModal } from '@/modules/workflows/components/DeleteWorkflowModal'
import { RunWorkflowRangeModal } from '@/modules/workflows/components/RunWorkflowRangeModal'
import { WorkflowModal } from '@/modules/workflows/components/WorkflowModal'
import workflowClasses from '@/modules/workflows/components/Workflows.module.css'
import { useRunWorkflow } from '@/modules/workflows/hooks/useRunWorkflow'
import {
    useWorkflowMutations,
    useWorkflowQuery,
    useWorkflowTemplateSetupQuery,
} from '@/modules/workflows/hooks/useWorkflows'
import { describeWorkflowSchedule } from '@/modules/workflows/utils/workflowLabels'
import classes from '@/pages/PipelineDetailPage/PipelineDetailPage.module.css'
import { PageLoader } from '@/shared/components/ui/PageLoader'
import shellClasses from '@/shared/components/ui/PageShell/PageShell.module.css'

type TabKey = 'flow' | 'pipelines' | 'runs'

const WorkflowDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>()
    const engine = useDataEngine()
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState<TabKey>('flow')
    const [showEdit, setShowEdit] = useState(false)
    const [showDelete, setShowDelete] = useState(false)
    const [deleteError, setDeleteError] = useState<string | null>(null)
    const [showRange, setShowRange] = useState(false)
    const {
        data: workflow,
        isLoading,
        isError,
        error,
    } = useWorkflowQuery(engine, id)
    const { deleteWorkflowMutation } = useWorkflowMutations(engine)
    const { run, isRunning } = useRunWorkflow()
    const { data: setup } = useWorkflowTemplateSetupQuery(
        engine,
        id,
        Boolean(workflow?.template)
    )

    if (isLoading) {
        return <PageLoader />
    }
    if (isError || !workflow) {
        return (
            <div className={shellClasses.pageRoot}>
                <NoticeBox error title={i18n.t('Could not load the workflow')}>
                    {error instanceof Error ? error.message : null}
                </NoticeBox>
            </div>
        )
    }

    const confirmDelete = () => {
        setDeleteError(null)
        deleteWorkflowMutation.mutate(workflow.id, {
            onSuccess: () => navigate('/workflows'),
            onError: (err) =>
                setDeleteError(
                    err instanceof Error
                        ? err.message
                        : i18n.t('Could not delete the workflow')
                ),
        })
    }

    return (
        <div className={shellClasses.pageRoot}>
            <div className={classes.breadcrumb}>
                <Button
                    small
                    icon={<IconArrowLeft16 />}
                    onClick={() => navigate('/workflows')}
                >
                    {i18n.t('Workflows')}
                </Button>
                <span className={classes.breadcrumbSep}>/</span>
                <span>{workflow.name}</span>
            </div>

            <div className={classes.header}>
                <div>
                    <h2>{workflow.name}</h2>
                    {workflow.description && (
                        <p className={classes.description}>
                            {workflow.description}
                        </p>
                    )}
                </div>
                <ButtonStrip>
                    <span
                        title={
                            workflow.pipelines.length === 0
                                ? i18n.t(
                                      'Add a pipeline before triggering the workflow'
                                  )
                                : !workflow.isActive
                                  ? i18n.t(
                                        'Inactive workflows do not run; edit it to switch it on'
                                    )
                                  : undefined
                        }
                    >
                        <SplitButton
                            primary
                            disabled={
                                isRunning ||
                                !workflow.isActive ||
                                workflow.pipelines.length === 0
                            }
                            onClick={() => run(workflow.id)}
                            component={
                                <FlyoutMenu dense>
                                    <MenuItem
                                        label={i18n.t(
                                            'Trigger for a fixed range…'
                                        )}
                                        onClick={() => setShowRange(true)}
                                    />
                                </FlyoutMenu>
                            }
                        >
                            {i18n.t('Trigger')}
                        </SplitButton>
                    </span>
                    {/* {workflow.template && (
                        <Button
                            icon={<IconSettings16 />}
                            onClick={() =>
                                navigate(`/workflows/${workflow.id}/setup`)
                            }
                        >
                            {i18n.t('Edit setup')}
                        </Button>
                    )} */}
                    <Button
                        icon={<IconEdit16 />}
                        onClick={() => setShowEdit(true)}
                    >
                        {i18n.t('Edit')}
                    </Button>
                    <Button
                        destructive
                        icon={<IconDelete16 />}
                        onClick={() => setShowDelete(true)}
                    >
                        {i18n.t('Delete')}
                    </Button>
                </ButtonStrip>
            </div>

            <div className={workflowClasses.meta}>
                <span>
                    <span className={workflowClasses.metaLabel}>
                        {i18n.t('Status')}
                    </span>
                    <ActiveTag active={workflow.isActive} />
                </span>
                <span>
                    <span className={workflowClasses.metaLabel}>
                        {i18n.t('Schedule')}
                    </span>
                    {describeWorkflowSchedule(workflow)}
                </span>
            </div>

            <TabBar>
                <Tab
                    selected={activeTab === 'flow'}
                    onClick={() => setActiveTab('flow')}
                >
                    {i18n.t('Flow')}
                </Tab>
                <Tab
                    selected={activeTab === 'pipelines'}
                    onClick={() => setActiveTab('pipelines')}
                >
                    {i18n.t('Pipelines ({{pipelines}})', {
                        pipelines: workflow.pipelines.length,
                    })}
                </Tab>
                <Tab
                    selected={activeTab === 'runs'}
                    onClick={() => setActiveTab('runs')}
                >
                    {i18n.t('Executions')}
                </Tab>
            </TabBar>

            <div className={classes.tabContent}>
                {activeTab === 'flow' && (
                    <WorkflowFlowTab workflow={workflow} />
                )}
                {activeTab === 'pipelines' && (
                    <WorkflowPipelinesTab workflow={workflow} />
                )}
                {activeTab === 'runs' && (
                    <WorkflowRunsTab workflowId={workflow.id} />
                )}
            </div>

            <WorkflowModal
                open={showEdit}
                workflow={workflow}
                onClose={() => setShowEdit(false)}
            />
            {showRange && (
                <RunWorkflowRangeModal
                    workflowName={workflow.name}
                    defaultPeriodType={setup?.params.periodType}
                    isPending={isRunning}
                    onClose={() => setShowRange(false)}
                    onRun={(range) =>
                        run(workflow.id, range, () => setShowRange(false))
                    }
                />
            )}
            {showDelete && (
                <DeleteWorkflowModal
                    workflow={workflow}
                    error={deleteError}
                    isPending={deleteWorkflowMutation.isPending}
                    onClose={() => {
                        setShowDelete(false)
                        setDeleteError(null)
                    }}
                    onConfirm={confirmDelete}
                />
            )}
        </div>
    )
}

export default WorkflowDetailPage
