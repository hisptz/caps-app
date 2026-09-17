import { useMemo } from 'react'
import type { HandlerDescriptor } from '@/capsApi/types'

export function getHandlerByKey(
    handlers: HandlerDescriptor[] | undefined,
    key: string | null | undefined
): HandlerDescriptor | undefined {
    if (!handlers || !key) {
        return undefined
    }
    return handlers.find((h) => h.key === key)
}

/** Human label for a step handler; falls back to raw key for legacy DB rows. */
export function getHandlerDisplayName(
    handlers: HandlerDescriptor[] | undefined,
    handlerKey: string | null | undefined
): string {
    if (!handlerKey) {
        return ''
    }
    return getHandlerByKey(handlers, handlerKey)?.displayName ?? handlerKey
}

export function useHandlerDisplayName(
    handlers: HandlerDescriptor[] | undefined,
    handlerKey: string | null | undefined
): string {
    return useMemo(
        () => getHandlerDisplayName(handlers, handlerKey),
        [handlers, handlerKey]
    )
}
