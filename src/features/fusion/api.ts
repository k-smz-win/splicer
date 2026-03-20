import type { Fusion } from '../../types'
import { tokenStore } from '../auth/token'

/** @see features/auth/api.ts の API_BASE と同じ命名規則。 */
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

/**
 * 融着作業データを取得する。
 *
 * @remarks
 * Cognito 移行時は tokenStore.get() の実装が変わる可能性があるが、この関数は変更不要。
 *
 * @param projectId 指定した場合そのプロジェクトの融着データのみを返す。省略時は全件返す。
 */
export async function fetchFusions(projectId?: string): Promise<Fusion[]> {
  const token = tokenStore.get()
  const url = projectId
    ? `${API_BASE}/api/fusion?projectId=${encodeURIComponent(projectId)}`
    : `${API_BASE}/api/fusion`

  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })

  if (!res.ok) throw new Error('fetch_fusions_failed')
  return res.json() as Promise<Fusion[]>
}
