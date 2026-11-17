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

/** Last month, a small interval that has data for most datasets. */
function lastMonth(): { start: string; end: string } {
    const now = new Date()
    const start = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)
    )
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0))
    return { start: isoDate(start), end: isoDate(end) }
}

function settingText(value: unknown, label?: string | null): string {
    if (label) {
        return label
    }
    if (value === undefined || value === null || value === '') {
        return '—'
    }
    return typeof value === 'string' ? value : JSON.stringify(value)
}

function dryRunVerdict(dryRun: OcsDryRun): {
    passed: boolean
    text: string
} {
    if (dryRun.error) {
        return { passed: false, text: dryRun.error }
    }
    const report = dryRun.report ?? {}
    const conflicts = Array.isArray(report.conflicts)
        ? report.conflicts.length
        : 0
    const passed = dryRun.rendered_only
        ? dryRun.values > 0
        : report.outcome === 'dry_run' && conflicts === 0
    const text = i18n.t(
        '{{values}} values for {{periods}} periods ({{start}} – {{end}}){{conflicts}}',
        {
            values: dryRun.values,
            periods: dryRun.periods.length,
            start: dryRun.start,
            end: dryRun.end,
            conflicts: conflicts > 0 ? `, ${conflicts} conflicts` : '',
            nsSeparator: '~~',
        }
    )
    return { passed, text }
}

function PipelineSummary({
    pipeline,
}: {
    pipeline: OcsPipeline
}): React.ReactElement {
    const engine = useDataEngine()
    const { dryRunMutation, modeMutation } = useOcsPipelineMutations(engine)
    const [interval, setDryRunInterval] = useState(lastMonth)
    const mode = pipeline.spec.delivery.mode
    const dryRun = dryRunMutation.data ?? pipeline.dry_run ?? null
    const verdict = dryRun ? dryRunVerdict(dryRun) : null
    const failingChecks = (pipeline.validation?.checks ?? []).filter(
        (check) => check.status === 'fail'
    )
    const series = pipeline.destination.settings.find(
        (s) => s.name === 'series'
    )
    const otherSettings = pipeline.destination.settings.filter(
        (s) => s.name !== 'series'
    )
    const actionError = dryRunMutation.error ?? modeMutation.error

    return (
        <div className={classes.summary}>
            <div className={classes.row}>
                <Tag positive={mode === 'live'} neutral={mode !== 'live'}>
                    {MODE_LABEL[mode] ?? mode}
                </Tag>
                {pipeline.approved ? (
                    <Tag positive>{i18n.t('Dry run passed')}</Tag>
                ) : (
                    <Tag>{i18n.t('No passed dry run')}</Tag>
                )}
                {pipeline.trigger.policy !== 'manual' ? (
                    <Tag negative>
                        {i18n.t('OCS also runs it on dataset updates')}
                    </Tag>
                ) : null}
            </div>
            <dl className={classes.summaryList}>
                <dt>{i18n.t('Workflow')}</dt>
                <dd>{pipeline.workflow.title}</dd>
                {pipeline.inputs.map((input) => (
                    <React.Fragment key={`${input.kind}-${input.parameter}`}>
                        <dt>
                            {input.kind === 'features'
                                ? i18n.t('Areas')
                                : i18n.t('Dataset')}
                        </dt>
                        <dd>{input.name}</dd>
                    </React.Fragment>
                ))}
                {otherSettings.map((setting) => (
                    <React.Fragment key={setting.name}>
                        <dt>{setting.title}</dt>
                        <dd>{settingText(setting.value, setting.label)}</dd>
                    </React.Fragment>
                ))}
                {(series?.rows ?? []).map((row, index) => (
                    <React.Fragment key={index}>
                        <dt>{i18n.t('Series {{n}}', { n: index + 1 })}</dt>
                        <dd>
                            {row
                                .filter((cell) => cell.value)
                                .map((cell) =>
                                    settingText(cell.value, cell.label)
                                )
                                .join(' · ')}
                        </dd>
                    </React.Fragment>
                ))}
            </dl>
            {failingChecks.length > 0 ? (
                <NoticeBox warning title={i18n.t('OCS checks failing')}>
                    <ul className={classes.problems}>
                        {failingChecks.map((check) => (
                            <li key={check.id}>{check.message}</li>
                        ))}
                    </ul>
                </NoticeBox>
            ) : null}
            {verdict ? (
                <NoticeBox
                    valid={verdict.passed}
                    warning={!verdict.passed}
                    title={
                        verdict.passed
                            ? i18n.t('Last dry run passed')
                            : i18n.t('Last dry run did not pass')
                    }
                >
                    {verdict.text}
                </NoticeBox>
            ) : null}
            {actionError ? (
                <NoticeBox error title={i18n.t('Open Climate Service refused')}>
                    {ocsErrorMessages(actionError).join(' ')}
                </NoticeBox>
            ) : null}
            <div className={classes.dryRunInputs}>
                <InputField
                    dense
                    type="date"
                    label={i18n.t('Dry run from')}
                    value={interval.start}
                    onChange={({ value }) =>
                        setDryRunInterval((current) => ({
                            ...current,
                            start: value ?? '',
                        }))
                    }
                />
                <InputField
                    dense
                    type="date"
                    label={i18n.t('to')}
                    value={interval.end}
                    onChange={({ value }) =>
                        setDryRunInterval((current) => ({
                            ...current,
                            end: value ?? '',
                        }))
                    }
                />
                <Button
                    small
                    loading={dryRunMutation.isPending}
                    disabled={!interval.start || !interval.end}
                    onClick={() =>
                        dryRunMutation.mutate({
                            id: pipeline.spec.id,
                            interval,
                        })
                    }
                >
                    {i18n.t('Dry run')}
                </Button>
                {mode !== 'live' ? (
                    <Button
                        small
                        primary
                        loading={modeMutation.isPending}
                        disabled={!pipeline.approved || modeMutation.isPending}
                        title={
                            pipeline.approved
                                ? undefined
                                : i18n.t('Going live needs a passed dry run')
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
                ) : (
                    <Button
                        small
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

/**
 * Picks the Open Climate Service pipeline a step runs, or creates or edits one in OCS, then
 * dry-runs it and takes it live, which OCS needs before a step can deliver for real.
 */
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

    const options = useMemo(
        () =>
            pipelines.map((item) => ({
                value: item.spec.id,
                label: `${item.spec.name || item.spec.id} · ${
                    MODE_LABEL[item.spec.delivery.mode] ??
                    item.spec.delivery.mode
                }`,
            })),
        [pipelines]
    )

    return (
        <Field
            label={label}
            required={required}
            helpText={helpText}
            error={Boolean(fieldState.error)}
            validationText={fieldState.error?.message}
        >
            {pipelinesQuery.error ? (
                <NoticeBox error title={i18n.t('Could not list OCS pipelines')}>
                    {ocsErrorMessages(pipelinesQuery.error).join(' ')}
                </NoticeBox>
            ) : null}
            <div className={classes.row}>
                <div style={{ flex: 1, minWidth: 240 }}>
                    <SingleSelectControl
                        name={name}
                        value={selectedId}
                        options={options}
                        loading={pipelinesQuery.isLoading}
                        placeholder={
                            pipelines.length === 0 && !pipelinesQuery.isLoading
                                ? i18n.t('No OCS pipelines yet: create one')
                                : i18n.t('Choose an OCS pipeline')
                        }
                        filterable={options.length > 8}
                        error={Boolean(fieldState.error)}
                        onChange={(value) => field.onChange(value)}
                    />
                </div>
                <Button
                    small
                    icon={<IconAdd16 />}
                    onClick={() => setModal('create')}
                >
                    {i18n.t('New OCS pipeline')}
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
            {selectedId && !selected && !pipelinesQuery.isLoading ? (
                <NoticeBox warning title={i18n.t('Pipeline not found in OCS')}>
                    {i18n.t(
                        '"{{id}}" is not in Open Climate Service any more. Choose another or create it again.',
                        { id: selectedId }
                    )}
                </NoticeBox>
            ) : null}
            {selected ? <PipelineSummary pipeline={selected} /> : null}
            <OcsPipelineModal
                open={modal !== null}
                pipeline={modal === 'edit' ? selected : null}
                onClose={() => setModal(null)}
                onSaved={(saved) => field.onChange(saved.spec.id)}
            />
        </Field>
    )
}
