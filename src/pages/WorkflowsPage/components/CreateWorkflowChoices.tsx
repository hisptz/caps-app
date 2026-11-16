import i18n from '@dhis2/d2-i18n'
import React from 'react'
import { useNavigate } from 'react-router'
import { ChoiceCard } from '@/modules/workflows/components/ChoiceCard'
import cardClasses from '@/modules/workflows/components/ChoiceCard.module.css'
import { TemplateIcon } from '@/modules/workflows/components/TemplateIcons'
import classes from '@/pages/WorkflowsPage/WorkflowsPage.module.css'

type Props = {
    onStartEmpty: () => void
}

/** The two ways to make a workflow, shown while there are none. */
export function CreateWorkflowChoices({
    onStartEmpty,
}: Props): React.ReactElement {
    const navigate = useNavigate()
    return (
        <section
            className={classes.choices}
            aria-labelledby="create-workflow-title"
        >
            <h3 id="create-workflow-title" className={classes.choicesTitle}>
                {i18n.t('Create a workflow')}
            </h3>
            <div className={cardClasses.grid}>
                <ChoiceCard
                    large
                    icon={<TemplateIcon kind="template" size={22} />}
                    title={i18n.t('From a template')}
                    description={i18n.t(
                        'Start from a ready-made workflow: pulling data from other instances, climate data with analytics, a prediction, or all of them together. The pipelines and connectors are already in place, so you fill in the details.'
                    )}
                    action={i18n.t('Browse templates')}
                    onClick={() => navigate('/workflows/new')}
                />
                <ChoiceCard
                    large
                    neutralIcon
                    icon={<TemplateIcon kind="empty" size={22} />}
                    title={i18n.t('From an empty workflow')}
                    description={i18n.t(
                        'Name the workflow, set its schedule, then build the flow yourself by adding pipelines and the connectors between them on an empty canvas.'
                    )}
                    action={i18n.t('Start empty')}
                    onClick={onStartEmpty}
                />
            </div>
        </section>
    )
}
