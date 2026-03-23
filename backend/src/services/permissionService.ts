import type { RoleCode, PermissionCode } from '../models/types'

/**
 * ロールから権限コード配列を解決するサービス。
 *
 * Cognito の custom:role（RoleCode 文字列）を直接受け取り、権限を返す。
 * roleId（UUID）は使用しない。
 *
 * バックエンドにおける権限解決の唯一のポイント。
 * handler は直接このマップを参照せず、必ず resolve() を経由すること。
 * フロントエンドに ROLE_PERMISSIONS を持たせてはならない。
 */
const ROLE_PERMISSIONS: Record<RoleCode, PermissionCode[]> = {
  SYS_ADMIN: ['VIEW_USER', 'MANAGE_PROJECT', 'VIEW_FUSION', 'EDIT_FUSION', 'VIEW_MAP', 'MANAGE_COMPANY'],
  MANAGER:   ['MANAGE_PROJECT', 'VIEW_FUSION', 'EDIT_FUSION', 'VIEW_MAP'],
  USER:      ['VIEW_FUSION', 'VIEW_MAP'],
  WORKER:    ['VIEW_FUSION', 'EDIT_FUSION'],
}

/**
 * @param role - Cognito custom:role から取得した RoleCode
 * @returns 解決済み権限コードの配列
 */
export function resolve(role: RoleCode): PermissionCode[] {
  return ROLE_PERMISSIONS[role] ?? []
}

export const permissionService = { resolve }
