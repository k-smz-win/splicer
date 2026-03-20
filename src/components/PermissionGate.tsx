import { useAuth } from '../contexts/AuthContext'
import { Permission } from '../constants/permissions'

interface Props {
  permission: Permission
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * UI レベルの権限制御ゲート。
 * 画面内での要素の表示・非表示にのみ使用する。
 * ルート単位のアクセス制御は `ProtectedRoute` で行う。
 */
export function PermissionGate({ permission, children, fallback = null }: Props) {
  const { hasPermission } = useAuth()
  return hasPermission(permission) ? <>{children}</> : <>{fallback}</>
}
