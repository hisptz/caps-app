import { z } from 'zod'
import type { HandlerDescriptor } from '@/capsApi/types'
import { getHandlerByKey } from '@/modules/handlers/utils/handlerLookup'

/**
 * Builds a Zod schema for handler runtime context from GET /handlers JSON Schema.
 */
export function buildHandlerContextSchema(
    descriptor: HandlerDescriptor
): z.ZodType | undefined {
    const jsonSchema = descriptor.schemas?.context
    if (!jsonSchema) {
        return undefined
    }
    return z.fromJSONSchema(jsonSchema)
}

const schemaMemo = new Map<string, z.ZodType | undefined>()

export function getHandlerContextSchema(
    handlers: HandlerDescriptor[],
    handlerKey: string
): z.ZodType | undefined {
    const cached = schemaMemo.get(handlerKey)
    if (cached !== undefined || schemaMemo.has(handlerKey)) {
        return cached
    }
    const descriptor = getHandlerByKey(handlers, handlerKey)
    const schema = descriptor
        ? buildHandlerContextSchema(descriptor)
        : undefined
    schemaMemo.set(handlerKey, schema)
    return schema
}

export function clearHandlerContextSchemaMemo(): void {
    schemaMemo.clear()
}
