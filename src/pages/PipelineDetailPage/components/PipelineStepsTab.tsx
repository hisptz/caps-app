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
    IconDelete16,
    IconEdit16,
    NoticeBox,
} from '@dhis2/ui'
import React, { useEffect, useRef, useState } from 'react'
import classes from '../PipelineDetailPage.module.css'
import type { HandlerDescriptor } from '@/capsApi/types'
import {
    getHandlerByKey,
    getHandlerDisplayName,
} from '@/modules/handlers/utils/handlerLookup'
import { OpenClimateServiceSyncCoverageNotice } from '@/modules/open-climate-service-sync/components/OpenClimateServiceSyncCoverageNotice'
import { PredictionCoverageNotice } from '@/modules/prediction-coverage/components/PredictionCoverageNotice'
import { TableScroll } from '@/shared/components/ui/TableScroll'
import type { PipelineStep } from '@/shared/types/caps'

type Props = {
    steps: PipelineStep[]
    handlers: HandlerDescriptor[] | undefined
    reorderError: string | null
    onAddStep: () => void
    onEditStep: (step: PipelineStep) => void
    onDeleteStep: (step: PipelineStep) => void
    onReorder: (fromIndex: number, toIndex: number) => void
    onUpdateSyncStep: (
        syncStep: PipelineStep,
        handlerConfig: Record<string, unknown>
    ) => void
    syncStepUpdating: boolean
    syncStepUpdateError: string | null
}

const enableNativeDrag = (row: HTMLTableRowElement | null) => {
    row?.setAttribute('draggable', 'true')
}

const DOT_POSITIONS = [4, 10, 16]

const DragHandleIcon = () => (
    <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
    >
        {DOT_POSITIONS.flatMap((cy) =>
            DOT_POSITIONS.map((cx) => (
                <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.6" />
            ))
        )}
    </svg>
)

export function PipelineStepsTab({
    steps,
    handlers,
    reorderError,
    onAddStep,
    onEditStep,
    onDeleteStep,
    onReorder,
    onUpdateSyncStep,
    syncStepUpdating,
    syncStepUpdateError,
}: Props): React.ReactElement {
    const [dragId, setDragId] = useState<string | null>(null)
    const [draftOrder, setDraftOrder] = useState<PipelineStep[] | null>(null)
    const draggingIdRef = useRef<string | null>(null)
    const droppedRef = useRef(false)

    useEffect(() => {
        setDraftOrder(null)
    }, [steps, reorderError])

    const displayedSteps = draftOrder ?? steps

    const moveDraggedOver = (overId: string) => {
        const draggingId = draggingIdRef.current
        if (!draggingId || draggingId === overId) {
            return
        }
        setDraftOrder((prev) => {
            const list = prev ?? steps
            const from = list.findIndex((s) => s.id === draggingId)
            const to = list.findIndex((s) => s.id === overId)
            if (from === -1 || to === -1 || from === to) {
                return prev
            }
            const next = [...list]
            const [moved] = next.splice(from, 1)
            next.splice(to, 0, moved)
            return next
        })
    }

    return (
        <>
            <div className={classes.tabActions}>
                <Button icon={<IconAdd16 />} onClick={onAddStep}>
                    {i18n.t('Add Step')}
                </Button>
            </div>
            {reorderError && (
                <NoticeBox error title={i18n.t('Could not reorder steps')}>
                    {reorderError}
                </NoticeBox>
            )}
            <OpenClimateServiceSyncCoverageNotice
                steps={steps}
                onUpdateSyncStep={onUpdateSyncStep}
                updating={syncStepUpdating}
                updateError={syncStepUpdateError}
            />
            <PredictionCoverageNotice steps={steps} />
            {steps.length === 0 ? (
                <NoticeBox title={i18n.t('No steps')}>
                    {i18n.t('Add a step to define this pipeline.')}
                </NoticeBox>
            ) : (
                <TableScroll label={i18n.t('Pipeline steps table')}>
                    <DataTable>
                        <DataTableHead>
                            <DataTableRow>
                                <DataTableColumnHeader />
                                <DataTableColumnHeader>
                                    {i18n.t('Order')}
                                </DataTableColumnHeader>
                                <DataTableColumnHeader>
                                    {i18n.t('Name')}
                                </DataTableColumnHeader>
                                <DataTableColumnHeader>
                                    {i18n.t('Handler')}
                                </DataTableColumnHeader>
                                <DataTableColumnHeader>
                                    {i18n.t('Queue')}
                                </DataTableColumnHeader>
                                <DataTableColumnHeader>
                                    {i18n.t('Max Retries')}
                                </DataTableColumnHeader>
                                <DataTableColumnHeader>
                                    {i18n.t('Actions')}
                                </DataTableColumnHeader>
                            </DataTableRow>
                        </DataTableHead>
                        <DataTableBody>
                            {displayedSteps.map((step) => {
                                return (
                                    <DataTableRow
                                        key={step.id}
                                        className={
                                            step.id === dragId
                                                ? `${classes.draggableRow} ${classes.dragging}`
                                                : classes.draggableRow
                                        }
                                        {...({
                                            ref: enableNativeDrag,
                                            onDragStart: (
                                                e: React.DragEvent
                                            ) => {
                                                e.dataTransfer.effectAllowed =
                                                    'move'
                                                e.dataTransfer.setData(
                                                    'text/plain',
                                                    step.id
                                                )
                                                draggingIdRef.current = step.id
                                                droppedRef.current = false
                                                setDragId(step.id)
                                            },
                                            onDragOver: (
                                                e: React.DragEvent
                                            ) => {
                                                e.preventDefault()
                                                e.dataTransfer.dropEffect =
                                                    'move'
                                                moveDraggedOver(step.id)
                                            },
                                            onDrop: (e: React.DragEvent) => {
                                                e.preventDefault()
                                                const draggingId =
                                                    draggingIdRef.current
                                                if (!draggingId) {
                                                    return
                                                }
                                                droppedRef.current = true
                                                const from = steps.findIndex(
                                                    (s) => s.id === draggingId
                                                )
                                                const to =
                                                    displayedSteps.findIndex(
                                                        (s) =>
                                                            s.id === draggingId
                                                    )
                                                if (from !== to) {
                                                    onReorder(from, to)
                                                } else {
                                                    setDraftOrder(null)
                                                }
                                            },
                                            onDragEnd: () => {
                                                if (!droppedRef.current) {
                                                    setDraftOrder(null)
                                                }
                                                draggingIdRef.current = null
                                                droppedRef.current = false
                                                setDragId(null)
                                            },
                                        } as Record<string, unknown>)}
                                    >
                                        <DataTableCell width="48px">
                                            <span
                                                className={classes.dragHandle}
                                            >
                                                <DragHandleIcon />
                                            </span>
                                        </DataTableCell>
                                        <DataTableCell>
                                            {step.stepOrder}
                                        </DataTableCell>
                                        <DataTableCell>
                                            {step.name}
                                        </DataTableCell>
                                        <DataTableCell>
                                            {getHandlerDisplayName(
                                                handlers,
                                                step.handlerKey
                                            )}
                                        </DataTableCell>
                                        <DataTableCell>
                                            {getHandlerByKey(
                                                handlers,
                                                step.handlerKey
                                            )?.queueName ?? (
                                                <span className={classes.muted}>
                                                    {i18n.t('inline')}
                                                </span>
                                            )}
                                        </DataTableCell>
                                        <DataTableCell>
                                            {step.maxRetries}
                                        </DataTableCell>
                                        <DataTableCell>
                                            <ButtonStrip>
                                                <Button
                                                    small
                                                    icon={<IconEdit16 />}
                                                    aria-label={i18n.t(
                                                        'Edit step'
                                                    )}
                                                    onClick={() =>
                                                        onEditStep(step)
                                                    }
                                                />
                                                <Button
                                                    small
                                                    destructive
                                                    icon={<IconDelete16 />}
                                                    aria-label={i18n.t(
                                                        'Delete step'
                                                    )}
                                                    onClick={() =>
                                                        onDeleteStep(step)
                                                    }
                                                />
                                            </ButtonStrip>
                                        </DataTableCell>
                                    </DataTableRow>
                                )
                            })}
                        </DataTableBody>
                    </DataTable>
                </TableScroll>
            )}
        </>
    )
}
