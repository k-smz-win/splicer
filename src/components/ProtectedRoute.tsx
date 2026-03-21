import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Permission } from '../constants/permissions'

interface Props {
  permission?: Permission
  children: React.ReactNode
}

/**
 * ルートレベルの認証・権限ガード。
 *
 * ready が false の間（セッション復元中）は何も描画しない。
 * 未認証は `/login` へ、権限不足は `/403` へリダイレクトする。
 * `permission` を省略した場合は認証チェックのみ行う。
 * UI 要素の表示・非表示制御には `PermissionGate` を使う。
 */
export function ProtectedRoute({ permission, children }: Props) {
  const { ready, isAuthenticated, hasPermission } = useAuth()

  if (!ready) return null
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (permission && !hasPermission(permission)) return <Navigate to="/403" replace />

  return <>{children}</>
}
