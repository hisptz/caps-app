import { useDataEngine } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import {
    NoticeBox,
    Pagination,
    SingleSelectField,
    SingleSelectOption,
} from '@dhis2/ui'
import React, { useState } from 'react'
import { DeadLettersTable } from './components/DeadLettersTable'
import classes from './DeadLettersPage.module.css'
import { CapsApiError } from '@/capsApi/client'
import { paginationToPageCount } from '@/capsApi/types'
import { useDeadLettersPageQueries } from '@/modules/monitoring/hooks/capsMonitoringHooks'
import { PageLoader } from '@/shared/components/ui/PageLoader'
import shellClasses from '@/shared/components/ui/PageShell/PageShell.module.css'

const DeadLettersPage: React.FC = () => {
    const engine = useDataEngine()
    const [pipelineId, setPipelineId] = useState('')
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(25)

    const { pipelinesFilterQuery, deadLettersQuery } =
        useDeadLettersPageQueries(engine, {
            pipelineId,
            page,
            pageSize,
        })
    const pipelinesData = pipelinesFilterQuery.data
    const pipelineOptions = pipelinesData?.pipelines ?? []

    const { data: deadLetterData, isLoading, isError, error } = deadLettersQuery

    const displayRows = deadLetterData?.logs ?? []
    const pagination = deadLetterData?.pagination
    const pageCount = pagination ? paginationToPageCount(pagination) : 1
    const total = pagination?.total ?? 0

    return (
        <div className={shellClasses.pageRoot}>
            <div className={classes.header}>
                <h2>{i18n.t('Dead Letters')}</h2>
            </div>

            <div className={classes.filters}>
                <SingleSelectField
                    label={i18n.t('Pipeline')}
                    selected={pipelineId}
                    onChange={({ selected }: { selected: string }) => {
                        setPipelineId(selected)
                        setPage(1)
                    }}
                    className={classes.filterField}
                >
                    <SingleSelectOption
                        value=""
                        label={i18n.t('All pipelines')}
                    />
                    {pipelineOptions.map((p) => (
                        <SingleSelectOption
                            key={p.id}
                            value={p.id}
                            label={p.name}
                        />
                    ))}
                </SingleSelectField>
            </div>

            {isLoading && !deadLetterData && <PageLoader variant="content" />}

            {isError && error instanceof CapsApiError && (
                <NoticeBox error title={i18n.t('Could not load dead letters')}>
                    {error.message}
                </NoticeBox>
            )}

            {!isLoading && !isError && displayRows.length === 0 ? (
                <NoticeBox title={i18n.t('No dead letters')}>
                    {pipelineId
                        ? i18n.t(
                              'No dead-letter events for the selected pipeline.'
                          )
                        : i18n.t('There are no dead-letter events to show.')}
                </NoticeBox>
            ) : (
                !isLoading &&
                !isError && <DeadLettersTable deadLetters={displayRows} />
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
        </div>
    )
}

export default DeadLettersPage
