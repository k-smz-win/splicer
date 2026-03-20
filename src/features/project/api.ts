import type { Project } from '../../types'
import { tokenStore } from '../auth/token'

/** @see features/auth/api.ts の API_BASE と同じ命名規則。 */
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

/**
 * プロジェクト一覧を取得する。
 *
 * @remarks
 * Cognito 移行時は tokenStore.get() の実装が変わる可能性があるが、この関数は変更不要。
 */
export async function fetchProjects(): Promise<Project[]> {
  const token = tokenStore.get()
  const res = await fetch(`${API_BASE}/api/projects`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })

  if (!res.ok) throw new Error('fetch_projects_failed')
  return res.json() as Promise<Project[]>
}
