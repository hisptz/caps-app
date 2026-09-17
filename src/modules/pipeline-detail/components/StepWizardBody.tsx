import i18n from '@dhis2/d2-i18n'
import { IconCheckmark16 } from '@dhis2/ui'
import React, { useMemo } from 'react'
import { useFormContext, useFormState } from 'react-hook-form'
import { BasicsPanel } from './BasicsPanel'
import { ConfigurationPanel } from './ConfigurationPanel'
import { HandlerPanel } from './HandlerPanel'
import classes from './StepWizard.module.css'
import type { HandlerDescriptor } from '@/capsApi/types'
import { getHandlerByKey } from '@/modules/handlers/utils/handlerLookup'
import { toHandlerTagLabels } from '@/modules/handlers/utils/handlerTags'
import type { PipelineStepFormWithHandlerValues } from '@/modules/pipeline-detail/schemas/stepFormSchema'
import {
    STEP_WIZARD_PANELS,
    type StepWizardPanel,
} from '@/modules/pipeline-detail/utils/stepWizardNavigation'
import { HandlerTag } from '@/shared/components/ui/HandlerTag/HandlerTag'

export { STEP_WIZARD_PANELS, type StepWizardPanel }

const PANEL_LABEL: Record<StepWizardPanel, string> = {
    basics: i18n.t('Basics'),
    handler: i18n.t('Handler'),
    configuration: i18n.t('Configuration'),
}

const PANEL_LEAD: Record<StepWizardPanel, string> = {
    basics: i18n.t('Name and describe this step.'),
    handler: i18n.t(
        'Pick the CAPS worker handler that runs when this step executes.'
    ),
    configuration: i18n.t(
        'Settings passed to the selected handler at run time.'
    ),
}

/** Fields owned by each panel; used by the rail and for panel validation. */
export const STEP_WIZARD_PANEL_FIELDS: Record<
    StepWizardPanel,
    Array<keyof PipelineStepFormWithHandlerValues>
> = {
    basics: ['name', 'description', 'maxRetries', 'retryDelayMs'],
    handler: ['handlerKey'],
    configuration: ['handlerConfig'],
}

export interface StepWizardBodyProps {
    pipelineName?: string
    active: StepWizardPanel
    panels?: readonly StepWizardPanel[]
    onActiveChange(panel: StepWizardPanel): void
    handlerSelectionDisabled?: boolean
    handlers?: HandlerDescriptor[]
    handlersLoading?: boolean
    handlersError?: Error | null
}

export function StepWizardBody({
    pipelineName,
    active,
    panels = STEP_WIZARD_PANELS,
    onActiveChange,
    handlerSelectionDisabled = false,
    handlers,
    handlersLoading = false,
    handlersError = null,
}: StepWizardBodyProps): React.ReactElement {
    const { watch } = useFormContext<PipelineStepFormWithHandlerValues>()
    const { errors, touchedFields } =
        useFormState<PipelineStepFormWithHandlerValues>()
    const handlerKeyRaw = watch('handlerKey')
    const selectedDescriptor = getHandlerByKey(handlers, handlerKeyRaw)

    const completed = useMemo(() => {
        return panels.filter((panel) => {
            if (panel === active) {
                return false
            }
            return STEP_WIZARD_PANEL_FIELDS[panel].every(
                (field) => Boolean(touchedFields[field]) && !errors[field]
            )
        })
    }, [panels, active, touchedFields, errors])

    const panelHasError = (panel: StepWizardPanel): boolean =>
        STEP_WIZARD_PANEL_FIELDS[panel].some((field) => Boolean(errors[field]))

    const tagLabels = toHandlerTagLabels(selectedDescriptor?.tags)

    return (
        <div className={classes.layout}>
            <nav className={classes.rail} aria-label={i18n.t('Step setup')}>
                <div className={classes.railHead}>{i18n.t('Step setup')}</div>
                <div className={classes.railMain}>
                    <div className={classes.railSteps}>
                        {panels.map((panel, idx) => {
                            const isActive = panel === active
                            const isDone = completed.includes(panel)
                            const hasError = panelHasError(panel)
                            return (
                                <button
                                    key={panel}
                                    type="button"
                                    onClick={() => onActiveChange(panel)}
                                    aria-current={isActive ? 'step' : undefined}
                                    className={[
                                        classes.railItem,
                                        isActive ? classes.active : '',
                                        isDone ? classes.done : '',
                                        hasError ? classes.error : '',
                                    ]
                                        .filter(Boolean)
                                        .join(' ')}
                                >
                                    <span className={classes.step}>
                                        {isDone ? <IconCheckmark16 /> : idx + 1}
                                    </span>
                                    {PANEL_LABEL[panel]}
                                </button>
                            )
                        })}
                    </div>
                    {selectedDescriptor && (
                        <div className={classes.railFooter}>
                            <div className={classes.railFooterLabel}>
                                {i18n.t('Step handler')}
                            </div>
                            <div className={classes.handlerKey}>
                                {selectedDescriptor.displayName}
                            </div>
                            {tagLabels.length > 0 && (
                                <div className={classes.railFooterTags}>
                                    {tagLabels.map((label) => (
                                        <HandlerTag key={label} label={label} />
                                    ))}
                                </div>
                            )}
                            {pipelineName && (
                                <div style={{ marginTop: 8 }}>
                                    {i18n.t('Pipeline')}: {pipelineName}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </nav>

            <section
                className={classes.panel}
                aria-labelledby="step-wizard-panel-title"
            >
                <header className={classes.panelHead}>
                    <h3
                        id="step-wizard-panel-title"
                        className={classes.panelTitle}
                    >
                        {PANEL_LABEL[active]}
                    </h3>
                    <span className={classes.panelCounter}>
                        {panels.indexOf(active) + 1} {i18n.t('of')}{' '}
                        {panels.length}
                    </span>
                </header>
                <p className={classes.panelLead}>{PANEL_LEAD[active]}</p>

                {active === 'basics' && <BasicsPanel />}
                {active === 'handler' && (
                    <HandlerPanel
                        selectionDisabled={handlerSelectionDisabled}
                        handlers={handlers}
                        handlersLoading={handlersLoading}
                        handlersError={handlersError}
                    />
                )}
                {active === 'configuration' && (
                    <ConfigurationPanel
                        handlerKey={handlerKeyRaw || undefined}
                    />
                )}
            </section>
        </div>
    )
}
