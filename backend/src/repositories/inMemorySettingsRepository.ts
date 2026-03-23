import type { RoleCode } from '../models/types'
import type {
  ICompanySettingsRepository,
  IUserSettingsRepository,
  CompanySetting,
  UserSetting,
  SettingValue,
} from './ISettingsRepository'

// =========================================
// InMemory 会社×ロール設定
// =========================================

export class InMemoryCompanySettingsRepository implements ICompanySettingsRepository {
  /** key: `${companyId}#${role}#${key}` */
  private store = new Map<string, CompanySetting>()

  private storeKey(companyId: string, role: string, key: string) {
    return `${companyId}#${role}#${key}`
  }

  async findByCompany(companyId: string): Promise<CompanySetting[]> {
    return [...this.store.values()].filter((s) => s.companyId === companyId)
  }

  async get(
    companyId: string,
    role: Exclude<RoleCode, 'SYS_ADMIN'>,
    key: string,
  ): Promise<SettingValue | null> {
    return this.store.get(this.storeKey(companyId, role, key))?.value ?? null
  }

  async set(
    companyId: string,
    role: Exclude<RoleCode, 'SYS_ADMIN'>,
    key: string,
    value: SettingValue,
  ): Promise<void> {
    this.store.set(this.storeKey(companyId, role, key), { companyId, role, key, value })
  }
}

// =========================================
// InMemory ユーザー個別設定
// =========================================

export class InMemoryUserSettingsRepository implements IUserSettingsRepository {
  /** key: `${cognitoSub}#${key}` */
  private store = new Map<string, UserSetting>()

  private storeKey(cognitoSub: string, key: string) {
    return `${cognitoSub}#${key}`
  }

  async findByUser(cognitoSub: string): Promise<UserSetting[]> {
    return [...this.store.values()].filter((s) => s.cognitoSub === cognitoSub)
  }

  async get(cognitoSub: string, key: string): Promise<SettingValue | null> {
    return this.store.get(this.storeKey(cognitoSub, key))?.value ?? null
  }

  async set(cognitoSub: string, key: string, value: SettingValue): Promise<void> {
    this.store.set(this.storeKey(cognitoSub, key), { cognitoSub, key, value })
  }

  async delete(cognitoSub: string, key: string): Promise<void> {
    this.store.delete(this.storeKey(cognitoSub, key))
  }
}
