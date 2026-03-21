import type { Project } from '../../types'
import { apiFetch } from '../../lib/apiClient'

/**
 * プロジェクト一覧を取得する。
 */
export async function fetchProjects(): Promise<Project[]> {
  const res = await apiFetch('/api/projects')
  if (!res.ok) throw new Error('fetch_projects_failed')
  return res.json() as Promise<Project[]>
}
