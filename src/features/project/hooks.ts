import type { Project } from '../../types'
import { fetchProjects } from './api'
import { useAsync } from '../../hooks/useAsync'

export function useProjects() {
  const { data, loading, error } = useAsync<Project[]>(fetchProjects)
  return { projects: data ?? [], loading, error }
}
