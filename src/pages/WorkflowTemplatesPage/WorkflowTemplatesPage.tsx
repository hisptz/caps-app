import { useDataEngine } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import { Button, IconArrowLeft16, NoticeBox } from '@dhis2/ui'
import React, { useState } from 'react'
import { useNavigate } from 'react-router'
import classes from './WorkflowTemplatesPage.module.css'
import { ChoiceCard } from '@/modules/workflows/components/ChoiceCard'
import cardClasses from '@/modules/workflows/components/ChoiceCard.module.css'
import {
    TemplateIcon,
    type TemplateIconKind,
} from '@/modules/workflows/components/TemplateIcons'
import { WorkflowModal } from '@/modules/workflows/components/WorkflowModal'
import { useWorkflowTemplatesQuery } from '@/modules/workflows/hooks/useWorkflows'
import { templateGallery } from '@/modules/workflows/utils/templateGallery'
import pageClasses from '@/pages/PipelineDetailPage/PipelineDetailPage.module.css'
import { PageLoader } from '@/shared/components/ui/PageLoader'
import shellClasses from '@/shared/components/ui/PageShell/PageShell.module.css'

/** Pick a template to start a new workflow from. */
const WorkflowTemplatesPage: React.FC = () => {
    const engine = useDataEngine()
    const navigate = useNavigate()
    const [showCreate, setShowCreate] = useState(false)
    const {
        data: templates,
        isLoading,
        isError,
        error,
    } = useWorkflowTemplatesQuery(engine)

    if (isLoading) {
        return <PageLoader />
    }

    // A card is open only when the engine offers the template behind it
    const offered = new Set((templates ?? []).map((t) => t.id))

    return (
        <div className={shellClasses.pageRoot}>
            <div className={pageClasses.breadcrumb}>
                <Button
                    small
                    icon={<IconArrowLeft16 />}
                    onClick={() => navigate('/workflows')}
                >
                    {i18n.t('Workflows')}
                </Button>
            </div>
            <div className={classes.page}>
                <div className={classes.heading}>
                    <h2>{i18n.t('New workflow from a template')}</h2>
                    <p className={classes.lead}>
                        {i18n.t(
                            'Each template comes with its pipelines and connectors already arranged. Choose one and the next step asks for the details it needs.'
                        )}
                    </p>
                </div>

                {isError && (
                    <NoticeBox error title={i18n.t('Could not load templates')}>
                        {error instanceof Error ? error.message : null}
                    </NoticeBox>
                )}

                <div className={cardClasses.gridWide}>
                    {templateGallery().map((entry) => {
                        const available = Boolean(
                            entry.template && offered.has(entry.template)
                        )
                        return (
                            <ChoiceCard
                                key={entry.id}
                                icon={
                                    <TemplateIcon
                                        kind={entry.id as TemplateIconKind}
                                    />
                                }
                                title={entry.title}
                                badge={
                                    available
                                        ? entry.eyebrow
                                        : i18n.t('Not available yet')
                                }
                                featured={available && entry.id === 'full'}
                                description={entry.description}
                                meta={entry.shape}
                                disabled={!available}
                                onClick={() =>
                                    navigate(
                                        `/workflows/new/${entry.template}?preset=${entry.id}`
                                    )
                                }
                            />
                        )
                    })}
                </div>

                <p className={classes.lead}>
                    {i18n.t('Nothing here fits?')}{' '}
                    <button
                        type="button"
                        className={classes.linkButton}
                        onClick={() => setShowCreate(true)}
                    >
                        {i18n.t('Start from an empty workflow')}
                    </button>{' '}
                    {i18n.t('and add the pipelines yourself.')}
                </p>
            </div>

            <WorkflowModal
                open={showCreate}
                onClose={() => setShowCreate(false)}
                onSaved={(created) => navigate(`/workflows/${created.id}`)}
            />
        </div>
    )
}

export default WorkflowTemplatesPage
