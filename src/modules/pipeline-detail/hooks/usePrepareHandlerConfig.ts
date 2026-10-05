import i18n from '@dhis2/d2-i18n'
import { useCallback } from 'react'
import { CREATE_MISSING_DATA_ELEMENTS } from '@/modules/dhis2-instance-pull/constants'
import {
    CreateMissingDataElementsError,
    type InstancePullDrafts,
    useCreateMissingDataElements,
    useVerifyPullTargets,
} from '@/modules/dhis2-instance-pull/hooks/useCreateMissingDataElements'
import type { Dhis2InstancePullConfigValue } from '@/modules/dhis2-instance-pull/schemas/config'
import type { PipelineStepFormWithHandlerValues } from '@/modules/pipeline-detail/schemas/stepFormSchema'

export type PreparedHandlerConfig =
    | { ok: true; handlerConfig: Record<string, unknown> | null | undefined }
    | { ok: false; message: string }

export function usePrepareHandlerConfig() {
    const createMissingDataElements = useCreateMissingDataElements()
    const verifyPullTargets = useVerifyPullTargets()

    return useCallback(
        async (
            values: PipelineStepFormWithHandlerValues
        ): Promise<PreparedHandlerConfig> => {
            if (
                values.handlerKey !== 'dhis2-instance-pull' ||
                !values.handlerConfig
            ) {
                return { ok: true, handlerConfig: values.handlerConfig }
            }
            try {
                if (!CREATE_MISSING_DATA_ELEMENTS) {
                    await verifyPullTargets(
                        values.handlerConfig as Dhis2InstancePullConfigValue
                    )
                    return { ok: true, handlerConfig: values.handlerConfig }
                }
                const { config } = await createMissingDataElements(
                    values.handlerConfig as Dhis2InstancePullConfigValue,
                    (values.handlerDrafts ?? {}) as InstancePullDrafts
                )
                return { ok: true, handlerConfig: config }
            } catch (err) {
                return {
                    ok: false,
                    message:
                        err instanceof CreateMissingDataElementsError
                            ? err.message
                            : i18n.t(
                                  'Could not check the staging data elements: {{message}}',
                                  {
                                      message:
                                          err instanceof Error
                                              ? err.message
                                              : String(err),
                                  }
                              ),
                }
            }
        },
        [createMissingDataElements, verifyPullTargets]
    )
}
