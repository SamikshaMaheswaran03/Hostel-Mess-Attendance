import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Async data fetching hook.
 * @param {Object} options
 * @param {string} options.queryKey  Cache key; refetching happens when it changes.
 * @param {Function} options.fetcher Returns a Promise of data.
 * @param {boolean} [options.enabled] Skip fetching when false.
 * @param {Function} [options.onSuccess]
 * @param {Function} [options.onError]
 * @param {number|null} [options.refetchInterval] Poll interval in ms.
 */
export function useQuery({
  queryKey,
  fetcher,
  enabled = true,
  onSuccess,
  onError,
  refetchInterval = null
}) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  const refetch = useCallback(async () => {
    if (!enabled) return
    setIsFetching(true)
    try {
      const result = await fetcherRef.current()
      setData(result)
      setError(null)
      onSuccess?.(result)
      return result
    } catch (err) {
      setError(err)
      onError?.(err)
    } finally {
      setIsFetching(false)
      setLoading(false)
    }
  }, [enabled, onSuccess, onError])

  useEffect(() => {
    if (enabled) {
      setLoading(true)
      refetch()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey, enabled])

  useEffect(() => {
    if (!refetchInterval || !enabled) return undefined
    const id = setInterval(refetch, refetchInterval)
    return () => clearInterval(id)
  }, [refetchInterval, enabled, refetch])

  return { data, error, loading, isFetching, refetch }
}
