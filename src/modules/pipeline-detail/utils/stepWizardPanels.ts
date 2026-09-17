import type { HandlerDescriptor } from '@/capsApi/types'
import { getHandlerByKey } from '@/modules/handlers/utils/handlerLookup'
import {
    STEP_WIZARD_PANELS,
    type StepWizardPanel,
} from '@/modules/pipeline-detail/utils/stepWizardNavigation'

/**
 * A handler only has something to configure when its descriptor ships a config
 * JSON Schema with at least one property. Everything else ends at Handler, so
 * the Configuration panel is dropped from the rail for those handlers.
 */
export function handlerHasConfiguration(
    handlers: HandlerDescriptor[] | undefined,
    handlerKey: string | null | undefined
): boolean {
    const descriptor = getHandlerByKey(handlers, handlerKey)
    if (!descriptor) {
        return true
    }
    const config = descriptor.schemas?.config
    if (!config) {
        return false
    }
    const properties = config.properties
    if (properties && typeof properties === 'object') {
        return Object.keys(properties).length > 0
    }
    return true
}

export function getVisibleStepWizardPanels(
    handlers: HandlerDescriptor[] | undefined,
    handlerKey: string | null | undefined
): StepWizardPanel[] {
    return STEP_WIZARD_PANELS.filter(
        (panel) =>
            panel !== 'configuration' ||
            handlerHasConfiguration(handlers, handlerKey)
    )
}
