import i18n from '@dhis2/d2-i18n'
import {
    Button,
    ButtonStrip,
    DropdownButton,
    FlyoutMenu,
    IconArrowLeft16,
    IconDelete16,
    IconEdit16,
    IconLaunch16,
    MenuItem,
    NoticeBox,
} from '@dhis2/ui'
import React from 'react'
import classes from '../PipelineDetailPage.module.css'
import type { PipelineDetailResponse } from '@/capsApi/types'

type Props = {
    pipeline: PipelineDetailResponse
    triggerLoading: boolean
    triggerError: string | null
    onNavigateBack: () => void
    onTrigger: () => void
    onTriggerWithContext: () => void
    onEdit: () => void
    onDelete: () => void
}

export function PipelineDetailHeader({
    pipeline,
    triggerLoading,
    triggerError,
    onNavigateBack,
    onTrigger,
    onTriggerWithContext,
    onEdit,
    onDelete,
}: Props): React.ReactElement {
    return (
        <>
            <div className={classes.breadcrumb}>
                <Button
                    small
                    icon={<IconArrowLeft16 />}
                    onClick={onNavigateBack}
                >
                    {i18n.t('Pipelines')}
                </Button>
                <span className={classes.breadcrumbSep}>/</span>
                <span>{pipeline.name}</span>
            </div>

            <div className={classes.header}>
                <div>
                    <h2>{pipeline.name}</h2>
                    {pipeline.description && (
                        <p className={classes.description}>
                            {pipeline.description}
                        </p>
                    )}
                </div>
                <ButtonStrip>
                    <DropdownButton
                        primary
                        icon={<IconLaunch16 />}
                        disabled={triggerLoading}
                        component={
                            <FlyoutMenu dense>
                                <MenuItem
                                    label={i18n.t('Trigger')}
                                    onClick={onTrigger}
                                />
                                <MenuItem
                                    label={i18n.t('Trigger with context…')}
                                    onClick={onTriggerWithContext}
                                />
                            </FlyoutMenu>
                        }
                    >
                        {i18n.t('Trigger')}
                    </DropdownButton>
                    <Button icon={<IconEdit16 />} onClick={onEdit}>
                        {i18n.t('Edit')}
                    </Button>
                    <Button
                        destructive
                        icon={<IconDelete16 />}
                        onClick={onDelete}
                    >
                        {i18n.t('Delete')}
                    </Button>
                </ButtonStrip>
            </div>

            {triggerError && (
                <NoticeBox error title={i18n.t('Could not start a run')}>
                    {triggerError}
                </NoticeBox>
            )}
        </>
    )
}
