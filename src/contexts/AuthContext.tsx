import { createContext, useContext, useState, type ReactNode } from 'react'
import type { User } from '../types'
import type { Permission } from '../constants/permissions'
import { tokenStore } from '../features/auth/token'

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
 * Cognito 連携に移行する際は login の呼び出し元（features/auth/api.ts）のみを差し替える。
 * このインターフェース自体は維持する。
 */
interface AuthContextValue extends AuthState {
  login: (user: User, permissions: Permission[]) => void
  logout: () => void
  /**
   * 現在ログイン中のユーザーが指定権限を持つか評価する。
   * バックエンドから受け取った permissions[] に対して includes のみで評価する。
   * 未認証状態（user が null）の場合は常に false を返す。
   *
   * @param permission チェック対象の権限
   */
  hasPermission: (permission: Permission) => boolean
}

/** 直接参照禁止。アクセスは必ず `useAuth` 経由で行う。 */
const AuthContext = createContext<AuthContextValue | null>(null)

/**
 * 認証状態をアプリ全体に提供する Provider。
 * アプリルートで一度だけ配置する。ネストした場合、内側が外側を上書きする。
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    permissions: [],
    isAuthenticated: false,
  })

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
    <AuthContext.Provider value={{ ...authState, login, logout, hasPermission }}>
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
