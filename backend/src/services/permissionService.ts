import { SEED_ROLE_PERMISSIONS, SEED_PERMISSIONS } from '../data/seed'
import type { PermissionCode } from '../models/types'

/**
 * ロールIDから解決済み権限コード配列を返す。
 *
 * バックエンドにおける権限解決の唯一のポイント。
 * handler は直接 seed データを参照せず、必ずこの関数を経由すること。
 * フロントエンドに ROLE_PERMISSIONS を持たせてはならない。
 *
 * DB 移行時はデータソース（SEED_*）の取得部分のみをここで差し替える。
 * 呼び出し元（handler）への影響はない。
 *
 * @param roleId - roles テーブルの id
 * @returns 解決済み権限コードの配列
 */
export function resolve(roleId: string): PermissionCode[] {
  // role_permissions テーブルから対象ロールに紐づく permission_id を収集
  const permissionIds = SEED_ROLE_PERMISSIONS
    .filter((rp) => rp.roleId === roleId)
    .map((rp) => rp.permissionId)

  // permissions テーブルで code に変換
  return SEED_PERMISSIONS
    .filter((p) => permissionIds.includes(p.id))
    .map((p) => p.code)
}

export const permissionService = { resolve }
