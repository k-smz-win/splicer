import { useState, useEffect } from 'react'
import type { Fusion } from '../../types'
import { fetchFusions } from './api'

export function useFusions(projectId?: string) {
  const [fusions, setFusions] = useState<Fusion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    fetchFusions(projectId)
      .then(setFusions)
      .catch(() => setError('fetch_failed'))
      .finally(() => setLoading(false))
  }, [projectId])

  return { fusions, loading, error }
}
