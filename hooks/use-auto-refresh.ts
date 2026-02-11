import { useEffect, useRef, useCallback } from 'react'

interface AutoRefreshOptions {
  /** Polling interval in milliseconds. Default: 30000 (30s) */
  interval?: number
  /** Whether auto-refresh is enabled. Default: true */
  enabled?: boolean
}

/**
 * Hook for automatic data refresh via polling + visibility/focus events.
 * - Polls every `interval` ms while the page is visible
 * - Refreshes when the app returns to foreground (visibilitychange)
 * - Refreshes when the window regains focus
 * - Debounces: won't refresh if last refresh was < 5s ago
 * 
 * @param loadFn - The data loading function to call. Use a silent variant
 *   (one that doesn't set loading=true) so background refreshes don't show spinners.
 * @param options - Configuration options
 * @returns A manual refresh function
 */
export function useAutoRefresh(
  loadFn: () => void | Promise<void>,
  options: AutoRefreshOptions = {}
) {
  const { interval = 30000, enabled = true } = options
  const loadFnRef = useRef(loadFn)
  const lastRefreshRef = useRef<number>(0)

  // Keep ref updated so interval always calls latest version
  useEffect(() => {
    loadFnRef.current = loadFn
  }, [loadFn])

  const refresh = useCallback(() => {
    const now = Date.now()
    // Debounce: skip if last refresh was less than 5s ago
    if (now - lastRefreshRef.current < 5000) return
    lastRefreshRef.current = now
    loadFnRef.current()
  }, [])

  useEffect(() => {
    if (!enabled) return

    // Periodic polling — only when page is visible
    const timer = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        refresh()
      }
    }, interval)

    // Refresh when app comes back to foreground
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refresh()
      }
    }

    // Refresh when window regains focus (e.g. switching from another app)
    const handleFocus = () => {
      refresh()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [enabled, interval, refresh])

  return refresh
}
