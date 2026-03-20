import { useState, useEffect } from 'react'
import type { Project } from '../../types'
import { fetchProjects } from './api'

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProjects()
      .then(setProjects)
      .catch(() => setError('fetch_failed'))
      .finally(() => setLoading(false))
  }, [])

  return { projects, loading, error }
}
