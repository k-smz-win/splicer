import { useState, useEffect } from 'react'

/**
 * 非同期データ取得の loading / error 状態を統一管理するフック。
 * useFusions・useProjects など API フェッチ系フックの共通基盤。
 */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fn()
      .then((result) => { if (!cancelled) setData(result) })
      .catch(() => { if (!cancelled) setError('fetch_failed') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { data, loading, error }
}
