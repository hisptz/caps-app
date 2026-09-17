import type { HandlerDescriptor } from '@/capsApi/types'
import { buildHandlerContextSchema } from '@/modules/handlers/utils/handlerContextSchemas'
import { getHandlerByKey } from '@/modules/handlers/utils/handlerLookup'

function pickTopLevelKeys(
    source: Record<string, unknown>,
    keys: string[]
): Record<string, unknown> {
    const result: Record<string, unknown> = {}
    for (const key of keys) {
        if (key in source && source[key] !== undefined) {
            result[key] = source[key]
        }
    }
    return result
}

function contextPropertyKeys(descriptor: HandlerDescriptor): string[] {
    const props = descriptor.schemas?.context?.properties
    if (!props || typeof props !== 'object') {
        return []
    }
    return Object.keys(props as Record<string, unknown>)
}

/**
 * Deep-picks handlerConfig fields that appear on the handler context schema,
 * then applies Zod defaults from the context schema when valid.
 */
export function deriveContextDefaults(
    handlers: HandlerDescriptor[],
    handlerKey: string,
    handlerConfig: Record<string, unknown> | null
): Record<string, unknown> {
    const descriptor = getHandlerByKey(handlers, handlerKey)
    if (!descriptor?.schemas?.context) {
        return {}
    }
    const keys = contextPropertyKeys(descriptor)
    const picked = pickTopLevelKeys(handlerConfig ?? {}, keys)
    const schema = buildHandlerContextSchema(descriptor)
    if (!schema) {
        return picked
    }
    const parsed = schema.safeParse(picked)
    if (parsed.success) {
        return parsed.data as Record<string, unknown>
    }
    return picked
}
