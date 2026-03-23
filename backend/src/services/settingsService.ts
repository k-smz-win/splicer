import type { RoleCode, ResolvedUser } from '../models/types'
import type { SettingValue } from '../repositories/ISettingsRepository'
import type { ICompanySettingsRepository, IUserSettingsRepository } from '../repositories/ISettingsRepository'
import {
  InMemoryCompanySettingsRepository,
  InMemoryUserSettingsRepository,
} from '../repositories/inMemorySettingsRepository'

// TODO: DI コンテナ導入時はここを差し替える
const companyRepo: ICompanySettingsRepository = new InMemoryCompanySettingsRepository()
const userRepo: IUserSettingsRepository = new InMemoryUserSettingsRepository()

// =========================================
// 設定キーのバリデーション
// =========================================

/** 有効な設定キー一覧。新しい設定項目はここに追加する。 */
const VALID_SETTING_KEYS = ['mfa_required'] as const
export type SettingKey = (typeof VALID_SETTING_KEYS)[number]

export function isValidSettingKey(key: string): key is SettingKey {
  return (VALID_SETTING_KEYS as readonly string[]).includes(key)
}

const VALID_ROLES: Exclude<RoleCode, 'SYS_ADMIN'>[] = ['MANAGER', 'USER', 'WORKER']

export function isValidRole(role: string): role is Exclude<RoleCode, 'SYS_ADMIN'> {
  return (VALID_ROLES as string[]).includes(role)
}

// =========================================
// システムデフォルト値
// =========================================

const DEFAULTS: Record<SettingKey, SettingValue> = {
  mfa_required: true,
}

// =========================================
// 会社設定
// =========================================

/**
 * 会社の全ロール×全キーの設定を返す。
 * 設定がなければシステムデフォルト値を補完する。
 *
 * @throws {Error} 'forbidden' - SYS_ADMIN以外はアクセス不可
 */
export async function getCompanySettings(
  companyId: string,
  actor: ResolvedUser,
): Promise<Record<Exclude<RoleCode, 'SYS_ADMIN'>, Record<string, SettingValue>>> {
  if (actor.role !== 'SYS_ADMIN') throw new Error('forbidden')

  const rows = await companyRepo.findByCompany(companyId)

  // ロール×キーのマップを構築し、未設定はデフォルト値で補完
  const result = {} as Record<Exclude<RoleCode, 'SYS_ADMIN'>, Record<string, SettingValue>>

  for (const role of VALID_ROLES) {
    result[role] = {}
    for (const key of VALID_SETTING_KEYS) {
      const row = rows.find((r) => r.role === role && r.key === key)
      result[role][key] = row?.value ?? DEFAULTS[key]
    }
  }

  return result
}

/**
 * 会社の特定ロール・キーの設定を更新する（upsert）。
 *
 * @throws {Error} 'forbidden' - SYS_ADMIN以外はアクセス不可
 * @throws {Error} 'invalid_role' - SYS_ADMIN または不正なロール
 * @throws {Error} 'invalid_key' - 存在しない設定キー
 */
export async function setCompanySetting(
  companyId: string,
  role: string,
  key: string,
  value: SettingValue,
  actor: ResolvedUser,
): Promise<{ companyId: string; role: string; key: string; value: SettingValue }> {
  if (actor.role !== 'SYS_ADMIN') throw new Error('forbidden')
  if (!isValidRole(role)) throw new Error('invalid_role')
  if (!isValidSettingKey(key)) throw new Error('invalid_key')

  await companyRepo.set(companyId, role, key, value)
  return { companyId, role, key, value }
}

// =========================================
// ユーザー個別設定
// =========================================

/**
 * ユーザーの設定を返す。
 * user_settings → company_settings → システムデフォルトの優先順で解決する。
 *
 * @throws {Error} 'forbidden' - 自分以外の設定はSYS_ADMINのみ取得可
 */
export async function getUserSettings(
  cognitoSub: string,
  companyId: string,
  role: RoleCode,
  actor: ResolvedUser,
): Promise<Record<string, SettingValue>> {
  if (actor.sub !== cognitoSub && actor.role !== 'SYS_ADMIN') throw new Error('forbidden')

  const result: Record<string, SettingValue> = {}

  for (const key of VALID_SETTING_KEYS) {
    result[key] = await resolveSettingValue(cognitoSub, companyId, role, key)
  }

  return result
}

/**
 * ユーザー個別設定を更新する（upsert）。
 *
 * @throws {Error} 'forbidden' - 自分以外の設定はSYS_ADMINのみ変更可
 * @throws {Error} 'invalid_key' - 存在しない設定キー
 */
export async function setUserSetting(
  cognitoSub: string,
  key: string,
  value: SettingValue,
  actor: ResolvedUser,
): Promise<void> {
  if (actor.sub !== cognitoSub && actor.role !== 'SYS_ADMIN') throw new Error('forbidden')
  if (!isValidSettingKey(key)) throw new Error('invalid_key')

  await userRepo.set(cognitoSub, key, value)
}

/**
 * ユーザー個別設定を削除し、会社設定に戻す。
 *
 * @throws {Error} 'forbidden' - 自分以外の設定はSYS_ADMINのみ削除可
 * @throws {Error} 'invalid_key' - 存在しない設定キー
 */
export async function deleteUserSetting(
  cognitoSub: string,
  key: string,
  actor: ResolvedUser,
): Promise<void> {
  if (actor.sub !== cognitoSub && actor.role !== 'SYS_ADMIN') throw new Error('forbidden')
  if (!isValidSettingKey(key)) throw new Error('invalid_key')

  await userRepo.delete(cognitoSub, key)
}

// =========================================
// 設定解決ロジック（内部）
// =========================================

/**
 * user_settings → company_settings → デフォルト の優先順で値を解決する。
 * MFA要否判定など、設定値が必要な箇所から呼び出す。
 */
export async function resolveSettingValue(
  cognitoSub: string,
  companyId: string,
  role: RoleCode,
  key: SettingKey,
): Promise<SettingValue> {
  // 1. ユーザー個別設定
  const userValue = await userRepo.get(cognitoSub, key)
  if (userValue !== null) return userValue

  // 2. 会社×ロール設定（SYS_ADMINは対象外、常にtrueを返す）
  if (role !== 'SYS_ADMIN' && isValidRole(role)) {
    const companyValue = await companyRepo.get(companyId, role, key)
    if (companyValue !== null) return companyValue
  }

  // 3. システムデフォルト
  return DEFAULTS[key]
}

export const settingsService = {
  getCompanySettings,
  setCompanySetting,
  getUserSettings,
  setUserSetting,
  deleteUserSetting,
  resolveSettingValue,
}
