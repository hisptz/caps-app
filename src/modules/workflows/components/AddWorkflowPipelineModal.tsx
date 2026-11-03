import { useDataEngine } from '@dhis2/app-runtime'
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
import React, { useEffect, useState } from 'react'
import classes from './Workflows.module.css'
import { NO_ESCAPE } from '@/modules/pipeline-connectors/utils/connectorLabels'
import { usePipelinesListQuery } from '@/modules/pipelines/hooks/usePipelinesListQuery'
import { useWorkflowMutations } from '@/modules/workflows/hooks/useWorkflows'
import type { Pipeline } from '@/shared/types/caps'

type Props = {
    open: boolean
    workflowId: string
    onClose: () => void
}

/** The engine's largest page; enough to pick from */
const PIPELINE_PAGE_SIZE = 100

function optionLabel(pipeline: Pipeline): string {
    if (pipeline.workflow) {
        return i18n.t('{{name}} (in “{{workflow}}”)', {
            name: pipeline.name,
            workflow: pipeline.workflow.name,
            interpolation: NO_ESCAPE,
        })
    }
    return pipeline.isActive
        ? pipeline.name
        : i18n.t('{{name}} (inactive)', {
              name: pipeline.name,
              interpolation: NO_ESCAPE,
          })
}

export function AddWorkflowPipelineModal({
    open,
    workflowId,
    onClose,
}: Props): React.ReactElement | null {
    const engine = useDataEngine()
    const { addPipelineMutation } = useWorkflowMutations(engine)
    const { data, isLoading } = usePipelinesListQuery(
        engine,
        1,
        PIPELINE_PAGE_SIZE
    )
    const [selected, setSelected] = useState<string | undefined>()
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (open) {
            setSelected(undefined)
            setError(null)
        }
    }, [open])

    if (!open) {
        return null
    }

    // Pipelines already in this workflow are not offered; ones in another are shown but locked
    const options = (data?.pipelines ?? [])
        .filter((p) => p.workflow?.id !== workflowId)
        .sort((a, b) => a.name.localeCompare(b.name))

    const add = () => {
        if (!selected) {
            setError(i18n.t('Choose a pipeline'))
            return
        }
        addPipelineMutation.mutate(
            { id: workflowId, pipelineId: selected },
            {
                onSuccess: onClose,
                onError: (err) =>
                    setError(
                        err instanceof Error
                            ? err.message
                            : i18n.t('Could not add the pipeline')
                    ),
            }
        )
    }

    return (
        <Modal onClose={onClose} position="middle">
            <ModalTitle>{i18n.t('Add pipeline')}</ModalTitle>
            <ModalContent>
                <div className={classes.modalBody}>
                    <SingleSelectField
                        label={i18n.t('Pipeline')}
                        filterable
                        noMatchText={i18n.t('No pipelines match')}
                        loading={isLoading}
                        selected={selected}
                        onChange={({ selected: next }) => {
                            setSelected(next)
                            setError(null)
                        }}
                        error={Boolean(error)}
                        validationText={error ?? undefined}
                    >
                        {options.map((pipeline) => (
                            <SingleSelectOption
                                key={pipeline.id}
                                value={pipeline.id}
                                label={optionLabel(pipeline)}
                                disabled={Boolean(pipeline.workflow)}
                            />
                        ))}
                    </SingleSelectField>
                    <p className={classes.help}>
                        {i18n.t(
                            'A pipeline can be in one workflow. To use the same pipeline in another workflow too, duplicate it from its page and add the copy.'
                        )}
                    </p>
                </div>
            </ModalContent>
            <ModalActions>
                <ButtonStrip end>
                    <Button onClick={onClose}>{i18n.t('Cancel')}</Button>
                    <Button
                        primary
                        loading={addPipelineMutation.isPending}
                        onClick={add}
                    >
                        {i18n.t('Add')}
                    </Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    )
}
