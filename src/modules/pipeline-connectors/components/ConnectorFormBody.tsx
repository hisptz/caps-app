import i18n from '@dhis2/d2-i18n'
import {
    Button,
    IconAdd16,
    InputField,
    SingleSelectField,
    SingleSelectOption,
    SwitchField,
    TextAreaField,
    NoticeBox,
} from '@dhis2/ui'
import React from 'react'
import {
    Controller,
    useFieldArray,
    useFormContext,
    useWatch,
} from 'react-hook-form'
import { ConnectorConditionRow } from './ConnectorConditionRow'
import classes from './ConnectorModal.module.css'
import type { HandlerDescriptor } from '@/capsApi/types'
import type { ConnectorFormValues } from '@/modules/pipeline-connectors/schemas/connectorFormSchema'
import { NO_ESCAPE } from '@/modules/pipeline-connectors/utils/connectorLabels'
import { stepOutputFields } from '@/modules/pipeline-connectors/utils/stepOutputs'
import {
    FormSection,
    formSectionGrids,
    SegmentedControl,
} from '@/shared/components/ui/FormPrimitives'
import type { PipelineRef, PipelineStep } from '@/shared/types/caps'

type Props = {
    targetOptions: PipelineRef[]
    targetOptionsLoading: boolean
    /** This pipeline's steps in order; conditions check their results */
    sourceSteps: PipelineStep[]
    handlers: HandlerDescriptor[]
}

const ON_OPTIONS = [
    { value: 'COMPLETED' as const, label: () => i18n.t('Succeeds') },
    { value: 'FAILED' as const, label: () => i18n.t('Fails') },
    { value: 'FINISHED' as const, label: () => i18n.t('Either way') },
]

// 'json' is not offered: it only holds a rule written outside the app, kept as it is
const RULE_MODE_OPTIONS = [
    { value: 'always' as const, label: () => i18n.t('Always start') },
    { value: 'conditions' as const, label: () => i18n.t('Only if…') },
]

function pipelineOptionLabel(pipeline: PipelineRef): string {
    return pipeline.isActive === false
        ? i18n.t('{{name}} (inactive)', { name: pipeline.name, ...NO_ESCAPE })
        : pipeline.name
}

export function ConnectorFormBody({
    targetOptions,
    targetOptionsLoading,
    sourceSteps,
    handlers,
}: Props): React.ReactElement {
    const { control, getValues, setValue, formState } =
        useFormContext<ConnectorFormValues>()
    const conditions = useFieldArray({ control, name: 'ruleConditions' })
    const ruleMode = useWatch({ control, name: 'ruleMode' })
    const targetPipelineId = useWatch({ control, name: 'targetPipelineId' })

    const switchRuleMode = (next: ConnectorFormValues['ruleMode']) => {
        if (next === 'conditions' && conditions.fields.length === 0) {
            conditions.append({ path: '', operator: 'gt', value: '0' })
        }
        setValue('ruleMode', next, { shouldValidate: false })
    }

    // Until the handler list loads, assume there is something to check
    const hasCheckableSteps =
        handlers.length === 0 ||
        sourceSteps.some(
            (_, i) =>
                (stepOutputFields(sourceSteps, i, handlers) ?? []).length > 0
        )

    // An otherwise pipeline only makes sense when there is a condition to fail
    const canHaveOtherwise =
        ruleMode === 'json' || (ruleMode === 'conditions' && hasCheckableSteps)

    const conditionsError =
        formState.errors.ruleConditions?.root?.message ??
        formState.errors.ruleConditions?.message

    return (
        <>
            <FormSection num={1} title={i18n.t('Identification')}>
                <Controller
                    name="name"
                    control={control}
                    render={({ field, fieldState }) => (
                        <InputField
                            label={i18n.t('Name')}
                            required
                            placeholder={i18n.t(
                                'e.g. Notify when alerts raised'
                            )}
                            value={field.value}
                            onChange={({ value }) =>
                                field.onChange(value ?? '')
                            }
                            onBlur={field.onBlur}
                            error={Boolean(fieldState.error)}
                            validationText={fieldState.error?.message}
                        />
                    )}
                />
                <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                        <TextAreaField
                            label={i18n.t('Description')}
                            value={field.value ?? ''}
                            onChange={({ value }) =>
                                field.onChange(value ?? '')
                            }
                            rows={2}
                        />
                    )}
                />
            </FormSection>

            <FormSection
                num={2}
                title={i18n.t('Start')}
                description={i18n.t('Which pipeline to start, and when')}
            >
                <Controller
                    name="targetPipelineId"
                    control={control}
                    render={({ field, fieldState }) => (
                        <SingleSelectField
                            label={i18n.t('Pipeline to start')}
                            required
                            filterable
                            noMatchText={i18n.t('No pipelines match')}
                            loading={targetOptionsLoading}
                            selected={
                                targetOptions.some((p) => p.id === field.value)
                                    ? field.value
                                    : undefined
                            }
                            onChange={({ selected }) =>
                                field.onChange(selected ?? '')
                            }
                            error={Boolean(fieldState.error)}
                            validationText={fieldState.error?.message}
                        >
                            {targetOptions.map((pipeline) => (
                                <SingleSelectOption
                                    key={pipeline.id}
                                    value={pipeline.id}
                                    label={pipelineOptionLabel(pipeline)}
                                />
                            ))}
                        </SingleSelectField>
                    )}
                />
                <div className={formSectionGrids.grid2}>
                    <Controller
                        name="on"
                        control={control}
                        render={({ field }) => (
                            <div>
                                <span className={classes.fieldLabel}>
                                    {i18n.t('Start it when this pipeline')}
                                </span>
                                <SegmentedControl
                                    name="connector-on"
                                    aria-label={i18n.t(
                                        'Start it when this pipeline'
                                    )}
                                    value={field.value}
                                    onChange={field.onChange}
                                    options={ON_OPTIONS.map((o) => ({
                                        value: o.value,
                                        label: o.label(),
                                    }))}
                                />
                            </div>
                        )}
                    />
                    <Controller
                        name="delayMinutes"
                        control={control}
                        render={({ field, fieldState }) => (
                            <InputField
                                label={i18n.t('Wait first (minutes)')}
                                type="number"
                                min="0"
                                value={field.value}
                                onChange={({ value }) =>
                                    field.onChange(value ?? '')
                                }
                                onBlur={field.onBlur}
                                error={Boolean(fieldState.error)}
                                validationText={
                                    fieldState.error?.message ??
                                    i18n.t('0 = start right away')
                                }
                            />
                        )}
                    />
                </div>
                <Controller
                    name="isActive"
                    control={control}
                    render={({ field }) => (
                        <SwitchField
                            checked={field.value}
                            onChange={({ checked }) => field.onChange(checked)}
                            label={
                                field.value
                                    ? i18n.t('Active')
                                    : i18n.t('Off (never starts anything)')
                            }
                        />
                    )}
                />
            </FormSection>

            <FormSection
                num={3}
                title={i18n.t('Condition (optional)')}
                description={i18n.t('Decides whether the pipeline starts')}
            >
                <SegmentedControl
                    name="connector-rule-mode"
                    aria-label={i18n.t('Rule type')}
                    value={ruleMode}
                    onChange={switchRuleMode}
                    options={RULE_MODE_OPTIONS.map((o) => ({
                        value: o.value,
                        label: o.label(),
                    }))}
                />

                {ruleMode === 'always' && (
                    <p className={classes.help}>
                        {i18n.t(
                            'The pipeline starts every time this one finishes as chosen above.'
                        )}
                    </p>
                )}

                {ruleMode === 'conditions' && !hasCheckableSteps && (
                    <NoticeBox title={i18n.t('Nothing to check')}>
                        {i18n.t(
                            'None of this pipeline’s steps report a count to check, so this connector can only always start.'
                        )}
                    </NoticeBox>
                )}

                {ruleMode === 'conditions' && hasCheckableSteps && (
                    <>
                        <p className={classes.help}>
                            {i18n.t(
                                'Each condition compares a count from one of this pipeline’s steps in the run that just finished with a number, e.g. “Values imported is more than 0”.'
                            )}
                        </p>
                        {conditions.fields.length > 1 && (
                            <Controller
                                name="ruleMatch"
                                control={control}
                                render={({ field }) => (
                                    <SegmentedControl
                                        name="connector-rule-match"
                                        aria-label={i18n.t(
                                            'How to combine conditions'
                                        )}
                                        value={field.value}
                                        onChange={field.onChange}
                                        options={[
                                            {
                                                value: 'all',
                                                label: i18n.t(
                                                    'All must be true'
                                                ),
                                            },
                                            {
                                                value: 'any',
                                                label: i18n.t(
                                                    'Any one is enough'
                                                ),
                                            },
                                        ]}
                                    />
                                )}
                            />
                        )}
                        <div className={classes.rows}>
                            {conditions.fields.map((row, index) => (
                                <ConnectorConditionRow
                                    key={row.id}
                                    index={index}
                                    steps={sourceSteps}
                                    handlers={handlers}
                                    onRemove={() => conditions.remove(index)}
                                />
                            ))}
                        </div>
                        {conditionsError && (
                            <p className={classes.error}>{conditionsError}</p>
                        )}
                        <div>
                            <Button
                                small
                                icon={<IconAdd16 />}
                                onClick={() =>
                                    conditions.append({
                                        path: '',
                                        operator: 'eq',
                                        value: '',
                                    })
                                }
                            >
                                {i18n.t('Add condition')}
                            </Button>
                        </div>
                    </>
                )}

                {ruleMode === 'json' && (
                    <NoticeBox
                        warning
                        title={i18n.t('This rule was written outside the app')}
                    >
                        <p className={classes.help}>
                            {i18n.t(
                                'It is kept as it is when you save. Choosing Always start or Only if… replaces it.'
                            )}
                        </p>
                        <pre className={classes.rulePreview}>
                            {getValues('ruleJson')}
                        </pre>
                    </NoticeBox>
                )}

                {canHaveOtherwise && (
                    <Controller
                        name="otherwisePipelineId"
                        control={control}
                        render={({ field, fieldState }) => (
                            <SingleSelectField
                                label={i18n.t('Otherwise start (optional)')}
                                placeholder={i18n.t('Nothing')}
                                clearable
                                clearText={i18n.t('Clear')}
                                filterable
                                noMatchText={i18n.t('No pipelines match')}
                                loading={targetOptionsLoading}
                                selected={
                                    targetOptions.some(
                                        (p) => p.id === field.value
                                    )
                                        ? field.value
                                        : undefined
                                }
                                onChange={({ selected }) =>
                                    field.onChange(selected ?? '')
                                }
                                error={Boolean(fieldState.error)}
                                validationText={
                                    fieldState.error?.message ??
                                    i18n.t(
                                        'Started instead when the condition is not met. Leave empty to start nothing.'
                                    )
                                }
                            >
                                {targetOptions
                                    .filter((p) => p.id !== targetPipelineId)
                                    .map((pipeline) => (
                                        <SingleSelectOption
                                            key={pipeline.id}
                                            value={pipeline.id}
                                            label={pipelineOptionLabel(
                                                pipeline
                                            )}
                                        />
                                    ))}
                            </SingleSelectField>
                        )}
                    />
                )}
            </FormSection>
        </>
    )
}
