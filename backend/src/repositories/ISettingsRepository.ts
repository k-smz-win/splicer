import type { RoleCode } from '../models/types'

/** company_settings / user_settings の共通値型。PostgreSQL では JSONB に対応する。 */
export type SettingValue = boolean | number | string

// =========================================
// 会社×ロール設定
// =========================================

export interface CompanySetting {
  companyId: string
  role: Exclude<RoleCode, 'SYS_ADMIN'>  // SYS_ADMIN は常にMFA必須のため対象外
  key: string
  value: SettingValue
}

/**
 * company_settings リポジトリのインターフェース。
 * PK: (company_id, role, key)
 */
export interface ICompanySettingsRepository {
  /** 会社の全ロール×全キーを返す */
  findByCompany(companyId: string): Promise<CompanySetting[]>

  /** 特定キーの値を返す。存在しない場合は null */
  get(companyId: string, role: Exclude<RoleCode, 'SYS_ADMIN'>, key: string): Promise<SettingValue | null>

  /** upsert */
  set(companyId: string, role: Exclude<RoleCode, 'SYS_ADMIN'>, key: string, value: SettingValue): Promise<void>
}

// =========================================
// ユーザー個別設定
// =========================================

export interface UserSetting {
  cognitoSub: string
  key: string
  value: SettingValue
}

/**
 * user_settings リポジトリのインターフェース。
 * PK: (cognito_sub, key)
 */
export interface IUserSettingsRepository {
  /** ユーザーの全キーを返す */
  findByUser(cognitoSub: string): Promise<UserSetting[]>

  /** 特定キーの値を返す。存在しない場合は null */
  get(cognitoSub: string, key: string): Promise<SettingValue | null>

  /** upsert */
  set(cognitoSub: string, key: string, value: SettingValue): Promise<void>

  /** 個別設定を削除して会社設定に戻す */
  delete(cognitoSub: string, key: string): Promise<void>
}
