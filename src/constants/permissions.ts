/**
 * システム内の全権限を定義する列挙。
 * `ProtectedRoute`（ルート制御）と `PermissionGate`（UI 制御）の両方から参照される。
 *
 * 権限を追加した場合は `ROLE_PERMISSIONS`（roles.ts）への反映が必須。
 */
export const Permission = {
  VIEW_USER: 'VIEW_USER',
  MANAGE_PROJECT: 'MANAGE_PROJECT',
  VIEW_FUSION: 'VIEW_FUSION',
  EDIT_FUSION: 'EDIT_FUSION',
  VIEW_MAP: 'VIEW_MAP',
} as const

export type Permission = (typeof Permission)[keyof typeof Permission]
