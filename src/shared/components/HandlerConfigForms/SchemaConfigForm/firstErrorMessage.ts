import { collectHandlerConfigErrorMessages } from '@/modules/pipeline-detail/utils/collectHandlerConfigErrorMessages'

/**
 * The first message on a field or anywhere below it. A list's errors sit on its items
 * (`dataElements.0`), not on the list, so `fieldState.error.message` alone misses them.
 */
export function firstErrorMessage(error: unknown): string | undefined {
    return collectHandlerConfigErrorMessages(error)[0]
}
