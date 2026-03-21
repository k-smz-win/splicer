import { tokenStore } from '../features/auth/token'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

/**
 * アプリ共通の fetch ラッパー。
 * - API_BASE を自動付与する
 * - localStorage のトークンを Authorization ヘッダーに自動付与する
 * - 呼び出し元は path と追加オプションのみ指定すればよい
 */
export function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = tokenStore.get()
  return fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  })
}
