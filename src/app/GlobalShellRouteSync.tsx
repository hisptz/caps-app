import { useEffect } from 'react'
import { useLocation } from 'react-router'

export function GlobalShellRouteSync(): null {
    const { pathname, search, hash } = useLocation()

    useEffect(() => {
        window.dispatchEvent(
            new PopStateEvent('popstate', { state: window.history.state })
        )
    }, [pathname, search, hash])

    return null
}
