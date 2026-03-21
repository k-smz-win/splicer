import type { User } from '../../types'
import type { Permission } from '../../constants/permissions'
import { tokenStore } from './token'
import { apiFetch } from '../../lib/apiClient'
import type { LoginCredentials } from './types'

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
  const res = await apiFetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  })

  if (!res.ok) throw new Error('invalid_credentials')

  const data = (await res.json()) as { user: User; permissions: Permission[]; token: string }
  tokenStore.set(data.token)
  return { user: data.user, permissions: data.permissions }
}

/**
 * 保存済みトークンからログイン中のユーザー情報と権限を取得する。
 * ページリロード時のセッション復元に使用する。
 *
 * @throws {Error} トークンが無効・期限切れの場合
 */
export async function meApi(): Promise<{ user: User; permissions: Permission[] }> {
  const res = await apiFetch('/api/auth/me')

  if (!res.ok) throw new Error('invalid_token')

  const data = (await res.json()) as { user: User; permissions: Permission[] }
  return { user: data.user, permissions: data.permissions }
}
