import { useDataEngine } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import {
    Button,
    DataTable,
    DataTableBody,
    DataTableCell,
    DataTableColumnHeader,
    DataTableHead,
    DataTableRow,
    DropdownButton,
    FlyoutMenu,
    IconAdd16,
    MenuItem,
    NoticeBox,
    Tag,
} from '@dhis2/ui'
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { formatDate } from '@/modules/pipeline-detail/utils/formatLabels'
import { WorkflowModal } from '@/modules/workflows/components/WorkflowModal'
import { useRunWorkflow } from '@/modules/workflows/hooks/useRunWorkflow'
import {
    useWorkflowsQuery,
    useWorkflowTemplatesQuery,
} from '@/modules/workflows/hooks/useWorkflows'
import { describeWorkflowSchedule } from '@/modules/workflows/utils/workflowLabels'
import classes from '@/pages/PipelinesPage/PipelinesPage.module.css'
import { PageLoader } from '@/shared/components/ui/PageLoader'
import shellClasses from '@/shared/components/ui/PageShell/PageShell.module.css'
import { StatusTag } from '@/shared/components/ui/StatusTag'
import tableNavLinkClasses from '@/shared/components/ui/TableNavLink/TableNavLink.module.css'
import { TableScroll } from '@/shared/components/ui/TableScroll'

const WorkflowsPage: React.FC = () => {
    const engine = useDataEngine()
    const navigate = useNavigate()
    const [showCreate, setShowCreate] = useState(false)
    const {
        data: workflows = [],
        isLoading,
        isError,
        error,
    } = useWorkflowsQuery(engine)
    const { run, isRunning, runningId } = useRunWorkflow()
    const { data: templates = [] } = useWorkflowTemplatesQuery(engine)

    return (
        <div className={shellClasses.pageRoot}>
            <div className={classes.header}>
                <h2>{i18n.t('Workflows')}</h2>
                <DropdownButton
                    primary
                    icon={<IconAdd16 />}
                    component={
                        <FlyoutMenu dense>
                            {templates.map((template) => (
                                <MenuItem
                                    key={template.id}
                                    label={i18n.t('From template {{name}}', {
                                        name: template.name,
                                    })}
                                    onClick={() =>
                                        navigate(
                                            `/workflows/new/${template.id}`
                                        )
                                    }
                                />
                            ))}
                            <MenuItem
                                label={i18n.t('Empty workflow')}
                                onClick={() => setShowCreate(true)}
                            />
                        </FlyoutMenu>
                    }
                >
                    {i18n.t('New workflow')}
                </DropdownButton>
            </div>

            {isLoading && <PageLoader variant="content" />}

            {isError && (
                <NoticeBox error title={i18n.t('Could not load workflows')}>
                    {error instanceof Error ? error.message : null}
                </NoticeBox>
            )}

            {!isLoading && !isError && workflows.length === 0 && (
                <NoticeBox title={i18n.t('No workflows yet')}>
                    {i18n.t(
                        'A workflow runs several pipelines as one process: one start launches its first pipelines together, and connectors start the rest.'
                    )}
                </NoticeBox>
            )}

            {workflows.length > 0 && (
                <TableScroll label={i18n.t('Workflows table')}>
                    <DataTable>
                        <DataTableHead>
                            <DataTableRow>
                                <DataTableColumnHeader>
                                    {i18n.t('Name')}
                                </DataTableColumnHeader>
                                <DataTableColumnHeader>
                                    {i18n.t('Pipelines')}
                                </DataTableColumnHeader>
                                <DataTableColumnHeader>
                                    {i18n.t('Schedule')}
                                </DataTableColumnHeader>
                                <DataTableColumnHeader>
                                    {i18n.t('Last run')}
                                </DataTableColumnHeader>
                                <DataTableColumnHeader>
                                    {i18n.t('Status')}
                                </DataTableColumnHeader>
                                <DataTableColumnHeader>
                                    {i18n.t('Actions')}
                                </DataTableColumnHeader>
                            </DataTableRow>
                        </DataTableHead>
                        <DataTableBody>
                            {workflows.map((workflow) => (
                                <DataTableRow key={workflow.id}>
                                    <DataTableCell>
                                        <Link
                                            to={`/workflows/${workflow.id}`}
                                            className={tableNavLinkClasses.link}
                                        >
                                            {workflow.name}
                                        </Link>
                                    </DataTableCell>
                                    <DataTableCell>
                                        {workflow._count.pipelines}
                                    </DataTableCell>
                                    <DataTableCell>
                                        {describeWorkflowSchedule(workflow)}
                                    </DataTableCell>
                                    <DataTableCell>
                                        {workflow.latestRun ? (
                                            <>
                                                <StatusTag
                                                    status={
                                                        workflow.latestRun
                                                            .status
                                                    }
                                                />{' '}
                                                {formatDate(
                                                    workflow.latestRun.createdAt
                                                )}
                                            </>
                                        ) : (
                                            i18n.t('Never run')
                                        )}
                                    </DataTableCell>
                                    <DataTableCell>
                                        {workflow.isActive ? (
                                            <Tag positive>
                                                {i18n.t('Active')}
                                            </Tag>
                                        ) : (
                                            <Tag neutral>
                                                {i18n.t('Inactive')}
                                            </Tag>
                                        )}
                                    </DataTableCell>
                                    <DataTableCell>
                                        <Button
                                            small
                                            disabled={
                                                !workflow.isActive ||
                                                workflow._count.pipelines ===
                                                    0 ||
                                                (isRunning &&
                                                    runningId === workflow.id)
                                            }
                                            onClick={() => run(workflow.id)}
                                        >
                                            {i18n.t('Run')}
                                        </Button>
                                    </DataTableCell>
                                </DataTableRow>
                            ))}
                        </DataTableBody>
                    </DataTable>
                </TableScroll>
            )}

            <WorkflowModal
                open={showCreate}
                onClose={() => setShowCreate(false)}
                onSaved={(created) => navigate(`/workflows/${created.id}`)}
            />
        </div>
    )
}

export default WorkflowsPage
