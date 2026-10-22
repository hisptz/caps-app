import i18n from '@dhis2/d2-i18n'
import { Tooltip } from '@dhis2/ui'
import React from 'react'
import classes from './Dhis2NotifyConfig.module.css'
import type { NotifyPlaceholder } from '@/modules/dhis2-notify/utils/placeholders'

type Props = {
    general: NotifyPlaceholder[]
    stepOutput: NotifyPlaceholder[]
    previousStepName?: string
    onInsert: (token: string) => void
}

function Pills({
    items,
    onInsert,
}: {
    items: NotifyPlaceholder[]
    onInsert: (token: string) => void
}) {
    return (
        <div className={classes.pills}>
            {items.map((item) => (
                <Tooltip
                    key={item.token}
                    content={`${item.token} · ${item.description}`}
                >
                    <button
                        type="button"
                        className={classes.pill}
                        onClick={() => onInsert(item.token)}
                    >
                        {item.label}
                    </button>
                </Tooltip>
            ))}
        </div>
    )
}

/** Placeholder buttons that insert their token at the cursor of the subject or message. */
export function PlaceholderPicker({
    general,
    stepOutput,
    previousStepName,
    onInsert,
}: Props): React.ReactElement {
    return (
        <div className={classes.picker}>
            <p className={classes.pickerTitle}>
                {i18n.t('Insert a placeholder')}
                <span className={classes.pickerHint}>
                    {i18n.t('filled in when the step runs')}
                </span>
            </p>
            <Pills items={general} onInsert={onInsert} />
            {stepOutput.length > 0 && (
                <>
                    <p className={classes.pickerGroup}>
                        {previousStepName
                            ? i18n.t('From the step "{{name}}"', {
                                  name: previousStepName,
                                  interpolation: { escapeValue: false },
                              })
                            : i18n.t('From the previous step')}
                    </p>
                    <Pills items={stepOutput} onInsert={onInsert} />
                </>
            )}
        </div>
    )
}
