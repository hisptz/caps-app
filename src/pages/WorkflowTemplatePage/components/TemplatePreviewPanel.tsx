import i18n from '@dhis2/d2-i18n'
import { CircularLoader, NoticeBox, Tag } from '@dhis2/ui'
import React from 'react'
import classes from '../WorkflowTemplatePage.module.css'
import type {
    TemplateIssue,
    TemplatePipelineRole,
    TemplatePreview,
} from '@/shared/types/caps'

type Props = {
    preview: TemplatePreview | undefined
    checking: boolean
    incomplete: boolean
}

function IssueList({ issues }: { issues: TemplateIssue[] }) {
    return (
        <ul className={classes.issues}>
            {issues.map((issue, index) => (
                <li key={`${issue.path}-${index}`}>{issue.message}</li>
            ))}
        </ul>
    )
}

const SHORT_NAME: Record<TemplatePipelineRole, string> = {
    climate: i18n.t('Climate data'),
    disease: i18n.t('Disease data'),
    // The pipeline after the data: analytics, and the prediction when there is one
    prediction: i18n.t('Analytics and prediction'),
}

/** What the parameters will create, with the engine's checks, updated as the form changes. */
export function TemplatePreviewPanel({
    preview,
    checking,
    incomplete,
}: Props): React.ReactElement {
    const plan = preview?.plan
    const join = plan?.join ?? null
    // Every pipeline the join does not start begins the run
    const startsRun = (role: TemplatePipelineRole) => join?.target !== role
    return (
        <aside className={classes.preview}>
            <div className={classes.previewHead}>
                <h3>{i18n.t('What it creates')}</h3>
                {checking && <CircularLoader extrasmall />}
            </div>

            {incomplete && !preview && (
                <p className={classes.help}>
                    {i18n.t(
                        'Fill in the form to see the pipelines and check them.'
                    )}
                </p>
            )}

            {preview && preview.errors.length > 0 && (
                <NoticeBox error title={i18n.t('To fix before saving')}>
                    <IssueList issues={preview.errors} />
                </NoticeBox>
            )}
            {preview && preview.warnings.length > 0 && (
                <NoticeBox warning title={i18n.t('Worth checking')}>
                    <IssueList issues={preview.warnings} />
                </NoticeBox>
            )}
            {preview?.setup && (
                <p className={classes.help}>
                    {i18n.t(
                        'Prediction setup "{{name}}" covers {{count}} org units, with inputs {{inputs}}',
                        {
                            name: preview.setup.name,
                            count: preview.setup.orgUnits.length,
                            inputs: preview.setup.covariateSources
                                .map((s) => s.covariate)
                                .join(', '),
                        }
                    )}
                </p>
            )}

            {plan && (
                <>
                    <ol className={classes.pipelines}>
                        {plan.pipelines.map((pipeline) => (
                            <li
                                key={pipeline.role}
                                className={classes.pipeline}
                            >
                                <div className={classes.pipelineHead}>
                                    <strong>{pipeline.name}</strong>
                                    {startsRun(pipeline.role) && (
                                        <Tag neutral>
                                            {i18n.t('Starts the run')}
                                        </Tag>
                                    )}
                                </div>
                                <ol className={classes.steps}>
                                    {pipeline.steps.map((step, index) => (
                                        <li
                                            key={index}
                                            title={step.description}
                                        >
                                            {step.name}
                                        </li>
                                    ))}
                                </ol>
                            </li>
                        ))}
                    </ol>
                    {join && (
                        <p className={classes.join}>
                            {join.kind === 'merge'
                                ? i18n.t(
                                      '{{sources}} run at the same time; {{target}} starts once all have succeeded.',
                                      {
                                          sources: join.sources
                                              .map((role) => SHORT_NAME[role])
                                              .join(' and '),
                                          target: SHORT_NAME[join.target],
                                      }
                                  )
                                : i18n.t(
                                      '{{target}} starts once {{source}} has succeeded.',
                                      {
                                          source: SHORT_NAME[join.source],
                                          target: SHORT_NAME[join.target],
                                      }
                                  )}
                        </p>
                    )}
                </>
            )}
        </aside>
    )
}
