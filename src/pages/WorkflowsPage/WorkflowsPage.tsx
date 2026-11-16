import { useDataEngine } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import {
    Button,
    ButtonStrip,
    DataTable,
    DataTableBody,
    DataTableCell,
    DataTableColumnHeader,
    DataTableHead,
    DataTableRow,
    IconAdd16,
    NoticeBox,
    Tag,
} from '@dhis2/ui'
import React, { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { formatDate } from '@/modules/pipeline-detail/utils/formatLabels'
import { WorkflowModal } from '@/modules/workflows/components/WorkflowModal'
import { WorkflowTableActions } from '@/modules/workflows/components/WorkflowTableActions'
import { useWorkflowsQuery } from '@/modules/workflows/hooks/useWorkflows'
import {
    filterWorkflows,
    NO_WORKFLOW_FILTERS,
    type WorkflowFilters,
} from '@/modules/workflows/utils/workflowFilters'
import { describeWorkflowSchedule } from '@/modules/workflows/utils/workflowLabels'
import classes from '@/pages/PipelinesPage/PipelinesPage.module.css'
import { CreateWorkflowChoices } from '@/pages/WorkflowsPage/components/CreateWorkflowChoices'
import { WorkflowsFilters } from '@/pages/WorkflowsPage/components/WorkflowsFilters'
import pageClasses from '@/pages/WorkflowsPage/WorkflowsPage.module.css'
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
    const empty = !isLoading && !isError && workflows.length === 0
    const [filters, setFilters] = useState<WorkflowFilters>(NO_WORKFLOW_FILTERS)
    const shown = useMemo(
        () => filterWorkflows(workflows, filters),
        [workflows, filters]
    )

    return (
        <div className={shellClasses.pageRoot}>
            <div className={classes.header}>
                <h2>{i18n.t('Workflows')}</h2>
                {!empty && (
                    <ButtonStrip end>
                        <Button onClick={() => setShowCreate(true)}>
                            {i18n.t('Empty workflow')}
                        </Button>
                        <Button
                            primary
                            icon={<IconAdd16 />}
                            onClick={() => navigate('/workflows/new')}
                        >
                            {i18n.t('New from template')}
                        </Button>
                    </ButtonStrip>
                )}
            </div>
            <p className={pageClasses.intro}>
                {i18n.t(
                    'A workflow runs several pipelines as one process, on a schedule or by hand.'
                )}
            </p>

            {isLoading && <PageLoader variant="content" />}

            {isError && (
                <NoticeBox error title={i18n.t('Could not load workflows')}>
                    {error instanceof Error ? error.message : null}
                </NoticeBox>
            )}

            {empty && (
                <CreateWorkflowChoices
                    onStartEmpty={() => setShowCreate(true)}
                />
            )}

            {workflows.length > 0 && (
                <WorkflowsFilters filters={filters} onChange={setFilters} />
            )}

            {workflows.length > 0 && shown.length === 0 && (
                <NoticeBox title={i18n.t('No workflows match')}>
                    <p className={pageClasses.noticeText}>
                        {i18n.t(
                            'None of the {{count}} workflows match the search and filters.',
                            { count: workflows.length }
                        )}
                    </p>
                    <Button
                        small
                        onClick={() => setFilters(NO_WORKFLOW_FILTERS)}
                    >
                        {i18n.t('Clear filters')}
                    </Button>
                </NoticeBox>
            )}

            {shown.length > 0 && (
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
                                    {i18n.t('Last execution')}
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
                            {shown.map((workflow) => (
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
                                        <WorkflowTableActions
                                            workflow={workflow}
                                        />
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
