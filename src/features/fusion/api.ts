import type { Fusion } from '../../types'
import { apiFetch } from '../../api/client'

/**
 * 融着作業データを取得する。
 *
 * @param projectId 指定した場合そのプロジェクトの融着データのみを返す。省略時は全件返す。
 */
export async function fetchFusions(projectId?: string): Promise<Fusion[]> {
  const path = projectId
    ? `/api/fusion?projectId=${encodeURIComponent(projectId)}`
    : '/api/fusion'

  const res = await apiFetch(path)
  if (!res.ok) throw new Error('fetch_fusions_failed')
  return res.json() as Promise<Fusion[]>
}
