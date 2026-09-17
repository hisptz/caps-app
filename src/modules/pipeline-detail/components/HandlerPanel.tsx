import i18n from '@dhis2/d2-i18n'
import { IconCheckmark16, InputField, NoticeBox } from '@dhis2/ui'
import React, { useMemo, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import classes from './StepWizard.module.css'
import type { HandlerDescriptor } from '@/capsApi/types'
import { toHandlerTagLabels } from '@/modules/handlers/utils/handlerTags'
import type { PipelineStepFormWithHandlerValues } from '@/modules/pipeline-detail/schemas/stepFormSchema'
import { HandlerTag } from '@/shared/components/ui/HandlerTag/HandlerTag'

export function HandlerPanel({
    selectionDisabled = false,
    handlers,
    handlersLoading,
    handlersError,
}: {
    selectionDisabled?: boolean
    handlers?: HandlerDescriptor[]
    handlersLoading?: boolean
    handlersError?: Error | null
}): React.ReactElement {
    const { setValue, watch } =
        useFormContext<PipelineStepFormWithHandlerValues>()
    const currentKey = watch('handlerKey')
    const [query, setQuery] = useState('')

    const all = handlers ?? []
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase()
        if (!q) {
            return all
        }
        return all.filter(
            (h) =>
                h.key.toLowerCase().includes(q) ||
                h.displayName.toLowerCase().includes(q) ||
                h.description.toLowerCase().includes(q) ||
                toHandlerTagLabels(h.tags).some((t) =>
                    t.toLowerCase().includes(q)
                )
        )
    }, [query, all])

    const selectHandler = (descriptor: HandlerDescriptor) => {
        if (selectionDisabled) {
            return
        }
        setValue('handlerKey', descriptor.key, {
            shouldDirty: true,
            shouldTouch: true,
            shouldValidate: true,
        })
        setValue('handlerConfig', null, {
            shouldDirty: true,
        })
    }

    if (handlersLoading) {
        return (
            <NoticeBox title={i18n.t('Loading handlers')}>
                {i18n.t('Fetching handler catalog from CAPS…')}
            </NoticeBox>
        )
    }

    if (handlersError) {
        return (
            <NoticeBox error title={i18n.t('Could not load handlers')}>
                {handlersError.message}
            </NoticeBox>
        )
    }

    return (
        <div className={classes.handlerPicker}>
            <InputField
                label={i18n.t('Search handlers')}
                placeholder={i18n.t('Search handlers...')}
                value={query}
                disabled={selectionDisabled}
                onChange={({ value }) => setQuery(value ?? '')}
            />
            {selectionDisabled && (
                <p className={classes.handlerLockedHelp}>
                    {i18n.t(
                        'Handler cannot be changed after the step is created.'
                    )}
                </p>
            )}
            <div
                className={classes.handlerList}
                role={selectionDisabled ? undefined : 'radiogroup'}
                aria-label={i18n.t('Handler catalog')}
                aria-disabled={selectionDisabled || undefined}
            >
                {filtered.map((h) => {
                    const isSelected = h.key === currentKey
                    const primaryTag = toHandlerTagLabels(h.tags)[0]
                    return (
                        <button
                            key={h.key}
                            type="button"
                            role={selectionDisabled ? undefined : 'radio'}
                            aria-checked={
                                selectionDisabled ? undefined : isSelected
                            }
                            aria-disabled={selectionDisabled || undefined}
                            tabIndex={selectionDisabled ? -1 : undefined}
                            disabled={selectionDisabled}
                            className={[
                                classes.handlerCard,
                                isSelected ? classes.handlerCardSelected : '',
                                selectionDisabled
                                    ? classes.handlerCardDisabled
                                    : '',
                            ]
                                .filter(Boolean)
                                .join(' ')}
                            onClick={() => selectHandler(h)}
                            onKeyDown={(e) => {
                                if (!selectionDisabled) {
                                    return
                                }
                                if (
                                    e.key === ' ' ||
                                    e.key === 'Enter' ||
                                    e.key === 'ArrowLeft' ||
                                    e.key === 'ArrowRight' ||
                                    e.key === 'ArrowUp' ||
                                    e.key === 'ArrowDown'
                                ) {
                                    e.preventDefault()
                                }
                            }}
                        >
                            <span className={classes.handlerCardTop}>
                                <span
                                    className={classes.handlerCardInitial}
                                    aria-hidden
                                >
                                    {h.displayName.charAt(0).toUpperCase()}
                                </span>
                                {isSelected && (
                                    <span
                                        className={classes.handlerCardCheck}
                                        aria-hidden
                                    >
                                        <IconCheckmark16 />
                                    </span>
                                )}
                            </span>
                            <span className={classes.handlerCardTitle}>
                                {h.displayName}
                            </span>
                            {primaryTag && (
                                <span className={classes.handlerCardTag}>
                                    <HandlerTag label={primaryTag} />
                                </span>
                            )}
                            <span className={classes.handlerCardDesc}>
                                {h.description}
                            </span>
                        </button>
                    )
                })}
                {filtered.length === 0 && (
                    <div className={classes.handlerListEmpty}>
                        {all.length === 0
                            ? i18n.t('No handlers available.')
                            : i18n.t('No handlers match “{{query}}”.', {
                                  query,
                              })}
                    </div>
                )}
            </div>
        </div>
    )
}
