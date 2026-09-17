import { useDataEngine } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import {
    Button,
    CircularLoader,
    IconAdd16,
    NoticeBox,
    Pagination,
} from '@dhis2/ui'
import React, { useState } from 'react'
import { PipelinesTable } from './components/PipelinesTable'
import classes from './PipelinesPage.module.css'
import { CapsApiError } from '@/capsApi/client'
import { paginationToPageCount } from '@/capsApi/types'
import { PipelineCreateModal } from '@/modules/pipelines/components/PipelineCreateModal'
import { usePipelinesListQuery } from '@/modules/pipelines/hooks/usePipelinesListQuery'
import shellClasses from '@/shared/components/ui/PageShell/PageShell.module.css'

const PipelinesPage: React.FC = () => {
    const engine = useDataEngine()
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(20)

    const { data, isLoading, isError, error } = usePipelinesListQuery(
        engine,
        page,
        pageSize
    )

    const rows = data?.pipelines ?? []
    const pagination = data?.pagination
    const pageCount = pagination ? paginationToPageCount(pagination) : 1
    const total = pagination?.total ?? 0

    return (
        <div className={shellClasses.pageRoot}>
            <div className={classes.header}>
                <h2>{i18n.t('Pipelines')}</h2>
                <Button
                    primary
                    icon={<IconAdd16 />}
                    onClick={() => setShowCreateModal(true)}
                >
                    {i18n.t('New Pipeline')}
                </Button>
            </div>

            {isLoading && (
                <div>
                    <CircularLoader />
                </div>
            )}

            {isError && error instanceof CapsApiError && (
                <NoticeBox error title={i18n.t('Could not load pipelines')}>
                    {error.message}
                </NoticeBox>
            )}

            {!isLoading && !isError && rows.length === 0 ? (
                <NoticeBox title={i18n.t('No pipelines yet')}>
                    {i18n.t('Create a pipeline to start scheduling work.')}
                </NoticeBox>
            ) : (
                !isLoading && !isError && <PipelinesTable pipelines={rows} />
            )}

            {!isLoading && !isError && total > 0 && (
                <div className={classes.pagination}>
                    <Pagination
                        page={page}
                        pageCount={pageCount}
                        pageSize={pageSize}
                        total={total}
                        onPageChange={(n: number) => setPage(n)}
                        onPageSizeChange={(n: number) => {
                            setPageSize(n)
                            setPage(1)
                        }}
                    />
                </div>
            )}

            <PipelineCreateModal
                open={showCreateModal}
                onClose={() => setShowCreateModal(false)}
            />
        </div>
    )
}

export default PipelinesPage
