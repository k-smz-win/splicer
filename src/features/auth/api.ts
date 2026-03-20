import type { User } from '../../types'
import type { Permission } from '../../constants/permissions'
import { tokenStore } from './token'
import type { LoginCredentials } from './types'

/**
 * バックエンド API のベース URL。
 * 開発環境: 未設定（空文字）→ Vite proxy が /api/* を http://backend:3000 に転送する。
 * 本番環境: VITE_API_BASE_URL に API Gateway の URL を設定する。
 */
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

/**
 * メールアドレスとパスワードで認証を行い、ユーザー情報と解決済み権限を返す。
 * ログイン成功時に JWT を tokenStore に保存する。
 *
 * @remarks
 * Cognito 移行時はこの関数のみを差し替える。引数・戻り値の型を維持すること。
 *
 * @throws {Error} 認証情報が一致しない場合（message: 'invalid_credentials'）
 */
export async function loginApi(
  credentials: LoginCredentials,
): Promise<{ user: User; permissions: Permission[] }> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  })

  if (!res.ok) throw new Error('invalid_credentials')

  const data = (await res.json()) as { user: User; permissions: Permission[]; token: string }
  tokenStore.set(data.token)
  return { user: data.user, permissions: data.permissions }
}
