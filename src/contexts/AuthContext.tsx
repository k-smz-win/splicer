import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { User } from '../types'
import type { Permission } from '../constants/permissions'
import { tokenStore } from '../features/auth/token'
import { fetchCurrentUser } from '../features/auth/api'

interface AuthState {
  user: User | null
  permissions: Permission[]
  isAuthenticated: boolean
}

/**
 * アプリ全体に公開する認証インターフェース。
 *
 * permissions はバックエンドの /api/auth/login・/api/auth/me が返す解決済み配列。
 * フロントはロールに依存せず、この配列のみで表示制御を行う。
 *
 * ready: ページリロード時のセッション復元が完了したかどうか。
 * false の間は ProtectedRoute がリダイレクト判定を保留する。
 */
interface AuthContextValue extends AuthState {
  ready: boolean
  login: (user: User, permissions: Permission[]) => void
  logout: () => void
  /**
   * 現在ログイン中のユーザーが指定権限を持つか評価する。
   * バックエンドから受け取った permissions[] に対して includes のみで評価する。
   * 未認証状態（user が null）の場合は常に false を返す。
   */
  hasPermission: (permission: Permission) => boolean
}

/** 直接参照禁止。アクセスは必ず `useAuth` 経由で行う。 */
const AuthContext = createContext<AuthContextValue | null>(null)

/**
 * 認証状態をアプリ全体に提供する Provider。
 * アプリルートで一度だけ配置する。
 * マウント時に localStorage のトークンで /api/auth/me を呼び出しセッションを復元する。
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    permissions: [],
    isAuthenticated: false,
  })

  // ページリロード時のセッション復元
  useEffect(() => {
    const token = tokenStore.get()
    if (!token) {
      setReady(true)
      return
    }
    fetchCurrentUser()
      .then(({ user, permissions }) => {
        setAuthState({ user, permissions, isAuthenticated: true })
      })
      .catch(() => {
        // トークンが無効・期限切れの場合はクリアして未認証状態のままにする
        tokenStore.clear()
      })
      .finally(() => {
        setReady(true)
      })
  }, [])

  const login = (user: User, permissions: Permission[]) => {
    setAuthState({ user, permissions, isAuthenticated: true })
  }

  const logout = () => {
    tokenStore.clear()
    setAuthState({ user: null, permissions: [], isAuthenticated: false })
  }

  const hasPermission = (permission: Permission): boolean => {
    return authState.permissions.includes(permission)
  }

  return (
    <AuthContext.Provider value={{ ...authState, ready, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * `AuthContext` へのアクセスを提供する Hook。
 * Provider 外での誤使用を開発時に即検出できるよう、未初期化状態では Error を throw する。
 *
 * @throws {Error} `AuthProvider` の外で呼ばれた場合
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
