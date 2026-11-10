import { useDataEngine } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import {
    Button,
    Checkbox,
    CircularLoader,
    IconAdd16,
    IconCross16,
    IconSearch16,
    Input,
    NoticeBox,
} from '@dhis2/ui'
import React, { useEffect, useId, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import classes from './AddPipelinesPanel.module.css'
import { NO_ESCAPE } from '@/modules/pipeline-connectors/utils/connectorLabels'
import { usePipelinesListQuery } from '@/modules/pipelines/hooks/usePipelinesListQuery'
import { useWorkflowMutations } from '@/modules/workflows/hooks/useWorkflows'
import type { Pipeline } from '@/shared/types/caps'

type Props = {
    workflowId: string
    onClose: () => void
    /** Where the panel floats, e.g. under the toolbar button that opened it */
    className?: string
}

/** The engine's largest page; enough to pick from */
const PIPELINE_PAGE_SIZE = 100

function stepCount(count: number): string {
    return count === 1 ? i18n.t('1 step') : i18n.t('{{count}} steps', { count })
}

function pipelineSummary(pipeline: Pipeline): string {
    const executions = pipeline._count.executions
    const parts = [
        stepCount(pipeline._count.steps),
        pipeline._count.schedules > 0
            ? i18n.t('scheduled')
            : i18n.t('no schedule'),
        executions === 0
            ? i18n.t('never run')
            : executions === 1
              ? i18n.t('1 execution')
              : i18n.t('{{count}} executions', { count: executions }),
    ]
    if (!pipeline.isActive) {
        parts.push(i18n.t('inactive'))
    }
    return parts.join(' · ')
}

function matches(pipeline: Pipeline, query: string): boolean {
    const q = query.trim().toLowerCase()
    return (
        !q ||
        pipeline.name.toLowerCase().includes(q) ||
        (pipeline.description ?? '').toLowerCase().includes(q)
    )
}

/** Pick one or more existing pipelines to add to a workflow. Floats over the flow. */
export function AddPipelinesPanel({
    workflowId,
    onClose,
    className,
}: Props): React.ReactElement {
    const engine = useDataEngine()
    const navigate = useNavigate()
    const titleId = useId()
    const { addPipelineMutation } = useWorkflowMutations(engine)
    const { data, isLoading, isError, error } = usePipelinesListQuery(
        engine,
        1,
        PIPELINE_PAGE_SIZE
    )
    const [query, setQuery] = useState('')
    const [selected, setSelected] = useState<Set<string>>(new Set())
    const [adding, setAdding] = useState(false)
    const [addError, setAddError] = useState<string | null>(null)

    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose()
            }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [onClose])

    const { available, inThisWorkflow, inOtherWorkflow } = useMemo(() => {
        const all = [...(data?.pipelines ?? [])].sort((a, b) =>
            a.name.localeCompare(b.name)
        )
        return {
            available: all.filter((p) => !p.workflow),
            inThisWorkflow: all.filter((p) => p.workflow?.id === workflowId),
            inOtherWorkflow: all.filter(
                (p) => p.workflow && p.workflow.id !== workflowId
            ),
        }
    }, [data, workflowId])

    const shown = available.filter((p) => matches(p, query))
    const shownInThis = inThisWorkflow.filter((p) => matches(p, query))
    const shownInOther = inOtherWorkflow.filter((p) => matches(p, query))
    const nothingToAdd = !isLoading && !isError && available.length === 0
    const noMatch =
        !nothingToAdd &&
        query.trim() !== '' &&
        shown.length + shownInThis.length + shownInOther.length === 0

    const toggle = (id: string) =>
        setSelected((current) => {
            const next = new Set(current)
            if (next.has(id)) {
                next.delete(id)
            } else {
                next.add(id)
            }
            return next
        })

    const add = async () => {
        setAddError(null)
        setAdding(true)
        const added: string[] = []
        try {
            // One at a time: the engine checks each pipeline against the workflow
            for (const pipelineId of selected) {
                await addPipelineMutation.mutateAsync({
                    id: workflowId,
                    pipelineId,
                })
                added.push(pipelineId)
            }
            onClose()
        } catch (err) {
            setSelected(
                (current) =>
                    new Set([...current].filter((id) => !added.includes(id)))
            )
            setAddError(
                err instanceof Error
                    ? err.message
                    : i18n.t('Could not add the pipeline')
            )
        } finally {
            setAdding(false)
        }
    }

    const header = (
        <div className={classes.header}>
            <div className={classes.titleRow}>
                <div className={classes.titles}>
                    <h3 id={titleId} className={classes.title}>
                        {i18n.t('Add pipeline')}
                    </h3>
                    {!nothingToAdd && (
                        <p className={classes.subtitle}>
                            {i18n.t(
                                'Pick the pipelines this workflow should run.'
                            )}
                        </p>
                    )}
                </div>
                <Button
                    small
                    icon={<IconCross16 />}
                    aria-label={i18n.t('Close')}
                    onClick={onClose}
                />
            </div>
            {!nothingToAdd && (
                <label className={classes.search}>
                    <span className={classes.visuallyHidden}>
                        {i18n.t('Search pipelines')}
                    </span>
                    <Input
                        dense
                        type="search"
                        name="pipeline-search"
                        // @dhis2/ui types this as a DOM Element; it renders a React node
                        prefixIcon={(<IconSearch16 />) as unknown as Element}
                        placeholder={i18n.t('Search pipelines')}
                        value={query}
                        onChange={({ value }) => setQuery(value ?? '')}
                        initialFocus
                    />
                </label>
            )}
        </div>
    )

    let body: React.ReactNode
    if (isLoading) {
        body = (
            <div className={classes.centered}>
                <CircularLoader small />
            </div>
        )
    } else if (isError) {
        body = (
            <div className={classes.notice}>
                <NoticeBox error title={i18n.t('Could not load pipelines')}>
                    {error instanceof Error ? error.message : null}
                </NoticeBox>
            </div>
        )
    } else if (nothingToAdd) {
        body = (
            <div className={classes.centered}>
                <svg
                    width="44"
                    height="44"
                    viewBox="0 0 44 44"
                    aria-hidden="true"
                    fill="none"
                    stroke="#8a95a3"
                    strokeWidth="1.6"
                >
                    <rect
                        x="6"
                        y="7"
                        width="32"
                        height="9"
                        rx="2"
                        strokeDasharray="4 3"
                    />
                    <rect
                        x="6"
                        y="19.5"
                        width="32"
                        height="9"
                        rx="2"
                        strokeDasharray="4 3"
                    />
                    <rect
                        x="6"
                        y="32"
                        width="32"
                        height="9"
                        rx="2"
                        strokeDasharray="4 3"
                    />
                </svg>
                <h4 className={classes.emptyTitle}>
                    {i18n.t('No pipelines available yet')}
                </h4>
                <p className={classes.emptyText}>
                    {inOtherWorkflow.length > 0
                        ? i18n.t(
                              'Every pipeline is already in a workflow. Create one under Pipelines in the main menu, or duplicate one from its page, then come back here to add it to the flow.'
                          )
                        : i18n.t(
                              'A workflow runs pipelines that already exist. Create one under Pipelines in the main menu, then come back here to add it to the flow.'
                          )}
                </p>
                <Button
                    icon={<IconAdd16 />}
                    onClick={() => navigate('/pipelines')}
                >
                    {i18n.t('Create a pipeline')}
                </Button>
            </div>
        )
    } else if (noMatch) {
        body = (
            <div className={classes.centered}>
                <svg
                    width="40"
                    height="40"
                    viewBox="0 0 40 40"
                    aria-hidden="true"
                    fill="none"
                    stroke="#8a95a3"
                    strokeWidth="1.6"
                >
                    <circle cx="17" cy="17" r="11" />
                    <path d="M25 25l9 9" />
                </svg>
                <h4 className={classes.emptyTitle}>
                    {i18n.t('No pipeline matches “{{query}}”', {
                        query: query.trim(),
                        interpolation: NO_ESCAPE,
                    })}
                </h4>
                <p className={classes.emptyText}>
                    {i18n.t(
                        'Check the spelling, or clear the search to see all {{count}} pipelines.',
                        { count: available.length }
                    )}
                </p>
                <Button onClick={() => setQuery('')}>
                    {i18n.t('Clear search')}
                </Button>
            </div>
        )
    } else {
        body = (
            <div className={classes.list}>
                {shown.map((pipeline) => {
                    const checked = selected.has(pipeline.id)
                    return (
                        <div
                            key={pipeline.id}
                            className={[
                                classes.option,
                                checked ? classes.optionSelected : '',
                            ]
                                .filter(Boolean)
                                .join(' ')}
                        >
                            <Checkbox
                                dense
                                checked={checked}
                                onChange={() => toggle(pipeline.id)}
                                label={
                                    <span className={classes.optionText}>
                                        <span className={classes.optionName}>
                                            {pipeline.name}
                                        </span>
                                        <span className={classes.optionMeta}>
                                            {pipelineSummary(pipeline)}
                                        </span>
                                    </span>
                                }
                            />
                        </div>
                    )
                })}
                {query.trim() !== '' &&
                    shown.length === 0 &&
                    available.length > 0 && (
                        <p className={classes.listNote}>
                            {i18n.t(
                                'No pipeline that can be added matches the search.'
                            )}
                        </p>
                    )}

                {shownInThis.length > 0 && (
                    <>
                        <p className={classes.groupLabel}>
                            {i18n.t('Already in this workflow')}
                        </p>
                        {shownInThis.map((pipeline) => (
                            <div key={pipeline.id} className={classes.locked}>
                                <span className={classes.lockedBox} />
                                <span className={classes.optionText}>
                                    <span className={classes.lockedName}>
                                        {pipeline.name}
                                    </span>
                                    <span className={classes.lockedMeta}>
                                        {i18n.t('{{steps}} · already added', {
                                            steps: stepCount(
                                                pipeline._count.steps
                                            ),
                                        })}
                                    </span>
                                </span>
                            </div>
                        ))}
                    </>
                )}

                {shownInOther.length > 0 && (
                    <>
                        <p className={classes.groupLabel}>
                            {i18n.t('In another workflow')}
                        </p>
                        {shownInOther.map((pipeline) => (
                            <div key={pipeline.id} className={classes.locked}>
                                <span className={classes.lockedBox} />
                                <span className={classes.optionText}>
                                    <span className={classes.lockedName}>
                                        {pipeline.name}
                                    </span>
                                    <span className={classes.lockedMeta}>
                                        {i18n.t(
                                            'In “{{workflow}}” · duplicate it from its page to use it here',
                                            {
                                                workflow:
                                                    pipeline.workflow?.name,
                                                interpolation: NO_ESCAPE,
                                            }
                                        )}
                                    </span>
                                </span>
                            </div>
                        ))}
                    </>
                )}
            </div>
        )
    }

    return (
        <div
            role="dialog"
            aria-labelledby={titleId}
            className={[classes.panel, className].filter(Boolean).join(' ')}
        >
            {header}
            {body}
            {addError && (
                <div className={classes.notice}>
                    <NoticeBox error title={i18n.t('Not all were added')}>
                        {addError}
                    </NoticeBox>
                </div>
            )}
            <div className={classes.footer}>
                {nothingToAdd ? (
                    <span />
                ) : (
                    <span className={classes.footerNote}>
                        {selected.size === 0
                            ? i18n.t('Nothing selected')
                            : i18n.t(
                                  'New pipelines are created under Pipelines in the main menu.'
                              )}
                    </span>
                )}
                <span className={classes.footerActions}>
                    <Button small onClick={onClose}>
                        {i18n.t('Cancel')}
                    </Button>
                    {!nothingToAdd && (
                        <Button
                            small
                            primary
                            disabled={selected.size === 0}
                            loading={adding}
                            onClick={add}
                        >
                            {selected.size > 1
                                ? i18n.t('Add {{count}} pipelines', {
                                      count: selected.size,
                                  })
                                : i18n.t('Add pipeline')}
                        </Button>
                    )}
                </span>
            </div>
        </div>
    )
}
