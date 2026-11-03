import i18n from '@dhis2/d2-i18n'
import {
    Button,
    ButtonStrip,
    Modal,
    ModalActions,
    ModalContent,
    ModalTitle,
    SingleSelectField,
    SingleSelectOption,
} from '@dhis2/ui'
import { zodResolver } from '@hookform/resolvers/zod'
import React from 'react'
import { Controller, FormProvider, useForm } from 'react-hook-form'
import { z } from 'zod'
import classes from './Workflows.module.css'
import { FixedPeriodSelector } from '@/shared/components/HandlerConfigForms/FixedPeriodSelector'
import type { RunPeriodRange } from '@/shared/types/caps'

const FORM_ID = 'run-workflow-range-form'

/** Sortable number for 2024W1 or 202401, so "ends before it starts" is caught here. */
function ordinal(periodId: string): number {
    const [year, week] = periodId.split('W')
    return week === undefined
        ? Number(periodId)
        : Number(year) * 100 + Number(week)
}

const rangeSchema = z
    .object({
        periodType: z.enum(['WEEKLY', 'MONTHLY']),
        start: z.string().min(1, i18n.t('Choose a period')),
        end: z.string().min(1, i18n.t('Choose a period')),
    })
    .refine(
        ({ start, end }) => !start || !end || ordinal(start) <= ordinal(end),
        { path: ['end'], message: i18n.t('The range ends before it starts') }
    )

type Props = {
    workflowName: string
    defaultPeriodType?: RunPeriodRange['periodType']
    isPending: boolean
    onClose: () => void
    onRun: (range: RunPeriodRange) => void
}

/** Run a workflow once over a fixed range of periods, e.g. to backfill history. */
export function RunWorkflowRangeModal({
    workflowName,
    defaultPeriodType = 'WEEKLY',
    isPending,
    onClose,
    onRun,
}: Props): React.ReactElement {
    const form = useForm<RunPeriodRange>({
        resolver: zodResolver(rangeSchema),
        defaultValues: { periodType: defaultPeriodType, start: '', end: '' },
    })

    return (
        <Modal onClose={onClose} position="middle">
            <ModalTitle>
                {i18n.t('Run {{name}} for a fixed range', {
                    name: workflowName,
                })}
            </ModalTitle>
            <ModalContent>
                <FormProvider {...form}>
                    <form
                        id={FORM_ID}
                        className={classes.modalBody}
                        onSubmit={form.handleSubmit(onRun)}
                    >
                        <p className={classes.help}>
                            {i18n.t(
                                'The first pipelines fetch data for these periods instead of their usual recent window. Use it to backfill history into staging.'
                            )}
                        </p>
                        <Controller
                            name="periodType"
                            control={form.control}
                            render={({ field }) => (
                                <SingleSelectField
                                    label={i18n.t('Period type')}
                                    selected={field.value}
                                    onChange={({ selected }) => {
                                        field.onChange(selected)
                                        form.setValue('start', '')
                                        form.setValue('end', '')
                                    }}
                                >
                                    <SingleSelectOption
                                        value="WEEKLY"
                                        label={i18n.t('Weekly')}
                                    />
                                    <SingleSelectOption
                                        value="MONTHLY"
                                        label={i18n.t('Monthly')}
                                    />
                                </SingleSelectField>
                            )}
                        />
                        <FixedPeriodSelector
                            periodTypeKey="periodType"
                            name="start"
                            label={i18n.t('From')}
                        />
                        <FixedPeriodSelector
                            periodTypeKey="periodType"
                            name="end"
                            label={i18n.t('To')}
                        />
                        <p className={classes.help}>
                            {i18n.t(
                                'Steps on another period type (e.g. daily climate data) keep their own window.'
                            )}
                        </p>
                    </form>
                </FormProvider>
            </ModalContent>
            <ModalActions>
                <ButtonStrip end>
                    <Button onClick={onClose}>{i18n.t('Cancel')}</Button>
                    <Button
                        primary
                        type="submit"
                        form={FORM_ID}
                        loading={isPending}
                    >
                        {i18n.t('Run')}
                    </Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    )
}
