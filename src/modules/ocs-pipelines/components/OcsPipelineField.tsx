import { useDataEngine } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import {
    Button,
    Field,
    IconAdd16,
    IconEdit16,
    InputField,
    NoticeBox,
    Tag,
} from '@dhis2/ui'
import React, { useMemo, useState } from 'react'
import { useController } from 'react-hook-form'
import {
    useOcsPipelineMutations,
    useOcsPipelinesQuery,
} from '../hooks/useOcsPipelines'
import { ocsErrorMessages } from '../utils/ocsErrors'
import classes from './OcsPipeline.module.css'
import { OcsPipelineModal } from './OcsPipelineModal'
import type { OcsDryRun, OcsPipeline } from '@/capsApi/types'
import { SingleSelectControl } from '@/shared/components/ui/FormPrimitives'

const MODE_LABEL: Record<string, string> = {
    dry_run: i18n.t('Dry run'),
    live: i18n.t('Live'),
    paused: i18n.t('Paused'),
}

function isoDate(date: Date): string {
    return date.toISOString().slice(0, 10)
}

/** Last month: a short interval most datasets have data for. */
function lastMonth(): { start: string; end: string } {
    const now = new Date()
    const start = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)
    )
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0))
    return { start: isoDate(start), end: isoDate(end) }
}

function text(value: unknown, label?: string | null): string {
    if (label) {
        return label
    }
    if (value === undefined || value === null || value === '') {
        return '—'
    }
    return typeof value === 'string' ? value : JSON.stringify(value)
}

/** One line on the last dry run, and whether it passed. */
function dryRunLine(dryRun: OcsDryRun): { passed: boolean; line: string } {
    if (dryRun.error) {
        return { passed: false, line: dryRun.error }
    }
    const report = dryRun.report ?? {}
    const conflicts = Array.isArray(report.conflicts)
        ? report.conflicts.length
        : 0
    const passed = dryRun.rendered_only
        ? dryRun.values > 0
        : report.outcome === 'dry_run' && conflicts === 0
    const counts = i18n.t('{{values}} values, {{start}} – {{end}}', {
        values: dryRun.values,
        start: dryRun.start,
        end: dryRun.end,
        nsSeparator: '~~',
    })
    const conflictText =
        conflicts > 0
            ? `, ${i18n.t('{{count}} conflicts', { count: conflicts })}`
            : ''
    return { passed, line: `${counts}${conflictText}` }
}

function PipelineCard({
    pipeline,
}: {
    pipeline: OcsPipeline
}): React.ReactElement {
    const engine = useDataEngine()
    const { dryRunMutation, modeMutation } = useOcsPipelineMutations(engine)
    const [interval, setDryRunInterval] = useState<{
        start: string
        end: string
    } | null>(null)
    const mode = pipeline.spec.delivery.mode
    const dryRun = dryRunMutation.data ?? pipeline.dry_run ?? null
    const lastDryRun = dryRun ? dryRunLine(dryRun) : null
    const failing = (pipeline.validation?.checks ?? []).filter(
        (check) => check.status === 'fail'
    )
    const connection = pipeline.destination.settings.find(
        (s) => s.name === 'connection'
    )
    const series = pipeline.destination.settings.find(
        (s) => s.name === 'series'
    )
    const dataElements = (series?.rows ?? [])
        .map((row) => row.find((cell) => cell.name.endsWith('data_element')))
        .filter(Boolean)
        .map((cell) => text(cell?.value, cell?.label))
    const actionError = dryRunMutation.error ?? modeMutation.error

    function runDryRun(): void {
        if (!interval) {
            return
        }
        dryRunMutation.mutate(
            { id: pipeline.spec.id, interval },
            { onSuccess: () => setDryRunInterval(null) }
        )
    }

    return (
        <div className={classes.card}>
            <div className={classes.cardHead}>
                <span className={classes.cardTitle}>
                    {pipeline.spec.name || pipeline.spec.id}
                </span>
                {pipeline.trigger.policy !== 'manual' ? (
                    <Tag negative>{i18n.t('Also runs on dataset updates')}</Tag>
                ) : null}
                <Tag positive={mode === 'live'} neutral={mode !== 'live'}>
                    {MODE_LABEL[mode] ?? mode}
                </Tag>
            </div>

            <dl className={classes.facts}>
                <dt>{i18n.t('Workflow')}</dt>
                <dd>{pipeline.workflow.title}</dd>
                {pipeline.inputs.map((input) => (
                    <React.Fragment key={`${input.kind}-${input.parameter}`}>
                        <dt>
                            {input.kind === 'features'
                                ? i18n.t('Org unit level')
                                : i18n.t('Dataset')}
                        </dt>
                        <dd>{input.name}</dd>
                    </React.Fragment>
                ))}
                <dt>{i18n.t('DHIS2')}</dt>
                <dd>{text(connection?.value, connection?.label)}</dd>
                <dt>{i18n.t('Data elements')}</dt>
                <dd>{dataElements.join(', ') || '—'}</dd>
            </dl>

            {failing.length > 0 ? (
                <NoticeBox warning title={i18n.t('Checks failing in OCS')}>
                    <ul className={classes.problems}>
                        {failing.map((check) => (
                            <li key={check.id}>{check.message}</li>
                        ))}
                    </ul>
                </NoticeBox>
            ) : null}
            {actionError ? (
                <NoticeBox error title={i18n.t('OCS refused')}>
                    {ocsErrorMessages(actionError).join(' ')}
                </NoticeBox>
            ) : null}

            <div className={classes.cardActions}>
                {interval ? (
                    <>
                        <div className={classes.dateInput}>
                            <InputField
                                dense
                                type="date"
                                label={i18n.t('From')}
                                value={interval.start}
                                onChange={({ value }) =>
                                    setDryRunInterval({
                                        ...interval,
                                        start: value ?? '',
                                    })
                                }
                            />
                        </div>
                        <div className={classes.dateInput}>
                            <InputField
                                dense
                                type="date"
                                label={i18n.t('To')}
                                value={interval.end}
                                onChange={({ value }) =>
                                    setDryRunInterval({
                                        ...interval,
                                        end: value ?? '',
                                    })
                                }
                            />
                        </div>
                        <Button
                            small
                            primary
                            loading={dryRunMutation.isPending}
                            disabled={!interval.start || !interval.end}
                            onClick={runDryRun}
                        >
                            {i18n.t('Run dry run')}
                        </Button>
                        <Button
                            small
                            secondary
                            onClick={() => setDryRunInterval(null)}
                        >
                            {i18n.t('Cancel')}
                        </Button>
                    </>
                ) : (
                    <>
                        <Button
                            small
                            onClick={() => setDryRunInterval(lastMonth())}
                        >
                            {i18n.t('Dry run')}
                        </Button>
                        {mode === 'live' ? (
                            <Button
                                small
                                secondary
                                loading={modeMutation.isPending}
                                onClick={() =>
                                    modeMutation.mutate({
                                        id: pipeline.spec.id,
                                        mode: 'dry_run',
                                    })
                                }
                            >
                                {i18n.t('Back to dry run')}
                            </Button>
                        ) : (
                            <Button
                                small
                                primary
                                loading={modeMutation.isPending}
                                disabled={!pipeline.approved}
                                title={
                                    pipeline.approved
                                        ? undefined
                                        : i18n.t('Needs a passed dry run')
                                }
                                onClick={() =>
                                    modeMutation.mutate({
                                        id: pipeline.spec.id,
                                        mode: 'live',
                                    })
                                }
                            >
                                {i18n.t('Go live')}
                            </Button>
                        )}
                        {lastDryRun ? (
                            <p
                                className={`${classes.status} ${
                                    lastDryRun.passed
                                        ? classes.statusOk
                                        : classes.statusBad
                                }`}
                            >
                                {lastDryRun.passed
                                    ? i18n.t('Dry run passed')
                                    : i18n.t('Dry run failed')}
                                {': '}
                                {lastDryRun.line}
                            </p>
                        ) : (
                            <p className={classes.status}>
                                {i18n.t('Not dry-run yet')}
                            </p>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

export interface OcsPipelineFieldProps {
    name: string
    label: string
    helpText?: string
    required: boolean
}

/** Picks the OCS pipeline a step runs, or creates or edits one in OCS. */
export function OcsPipelineField({
    name,
    label,
    helpText,
    required,
}: OcsPipelineFieldProps): React.ReactElement {
    const engine = useDataEngine()
    const { field, fieldState } = useController({ name })
    const pipelinesQuery = useOcsPipelinesQuery(engine)
    const [modal, setModal] = useState<'create' | 'edit' | null>(null)
    const pipelines = useMemo(
        () => pipelinesQuery.data ?? [],
        [pipelinesQuery.data]
    )
    const selectedId = typeof field.value === 'string' ? field.value : ''
    const selected =
        pipelines.find((item) => item.spec.id === selectedId) ?? null
    const missing = Boolean(
        selectedId && !selected && !pipelinesQuery.isLoading
    )

    const options = useMemo(
        () =>
            pipelines.map((item) => ({
                value: item.spec.id,
                label: item.spec.name || item.spec.id,
            })),
        [pipelines]
    )

    const validationText = pipelinesQuery.error
        ? ocsErrorMessages(pipelinesQuery.error).join(' ')
        : missing
          ? i18n.t('"{{id}}" is no longer in OCS', { id: selectedId })
          : fieldState.error?.message

    return (
        <Field
            label={label}
            required={required}
            helpText={helpText}
            error={Boolean(validationText)}
            validationText={validationText}
        >
            <div className={classes.pickerRow}>
                <div className={classes.pickerSelect}>
                    <SingleSelectControl
                        name={name}
                        value={selectedId}
                        options={options}
                        loading={pipelinesQuery.isLoading}
                        placeholder={i18n.t('Choose an OCS pipeline')}
                        filterable={options.length > 8}
                        error={Boolean(validationText)}
                        onChange={(value) => field.onChange(value)}
                    />
                </div>
                <Button
                    small
                    icon={<IconAdd16 />}
                    onClick={() => setModal('create')}
                >
                    {i18n.t('New')}
                </Button>
                <Button
                    small
                    icon={<IconEdit16 />}
                    disabled={!selected}
                    onClick={() => setModal('edit')}
                >
                    {i18n.t('Edit')}
                </Button>
            </div>
            {selected ? <PipelineCard pipeline={selected} /> : null}
            <OcsPipelineModal
                open={modal !== null}
                pipeline={modal === 'edit' ? selected : null}
                onClose={() => setModal(null)}
                onSaved={(saved) => field.onChange(saved.spec.id)}
            />
        </Field>
    )
}
