import { z } from 'zod'
import type { HandlerDescriptor } from '@/capsApi/types'
import { getHandlerByKey } from '@/modules/handlers/utils/handlerLookup'

/**
 * Builds a Zod schema for handlerConfig from the API JSON Schema payload.
 * Uses z.fromJSONSchema (Zod 4, experimental). Backend POST/PUT validation
 * remains authoritative when client and wire format diverge.
 */
export function buildHandlerConfigSchema(
    descriptor: HandlerDescriptor
): z.ZodType | undefined {
    const jsonSchema = descriptor.schemas?.config
    if (!jsonSchema) {
        return undefined
    }
    return z.fromJSONSchema(jsonSchema)
}

const schemaMemo = new Map<string, z.ZodType | undefined>()

export function getHandlerConfigSchema(
    handlers: HandlerDescriptor[],
    handlerKey: string
): z.ZodType | undefined {
    const cached = schemaMemo.get(handlerKey)
    if (cached !== undefined || schemaMemo.has(handlerKey)) {
        return cached
    }
    const descriptor = getHandlerByKey(handlers, handlerKey)
    const schema = descriptor ? buildHandlerConfigSchema(descriptor) : undefined
    schemaMemo.set(handlerKey, schema)
    return schema
}

/** Clear memo when handlers catalog is refetched (e.g. in tests). */
export function clearHandlerConfigSchemaMemo(): void {
    schemaMemo.clear()
}
