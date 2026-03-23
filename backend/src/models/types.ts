// =========================================
// ロール / 権限
// =========================================

/** Cognito custom:role と対応するロールコード。 */
export type RoleCode = 'SYS_ADMIN' | 'MANAGER' | 'USER' | 'WORKER'

/**
 * 権限の識別コード。
 * フロントエンドの Permission enum と同じ文字列値にすること。
 */
export type PermissionCode =
  | 'VIEW_USER'
  | 'MANAGE_PROJECT'
  | 'VIEW_FUSION'
  | 'EDIT_FUSION'
  | 'VIEW_MAP'
  | 'MANAGE_COMPANY'

// =========================================
// 認証コンテキスト
// =========================================

/**
 * authService が返す認証済みユーザー情報。
 * Cognito IDトークンから取得した属性をそのまま保持する。
 *
 * - sub       : Cognito ユーザーID（主キー）
 * - companyId : custom:company_id
 * - role      : custom:role（RoleCode に正規化済み）
 */
export interface ResolvedUser {
  sub: string
  companyId: string
  role: RoleCode
}

// =========================================
// 会社
// =========================================

export type CompanyType = 'ADMIN' | 'SALES' | 'AGENCY' | 'CUSTOMER'

export interface Company {
  id: string
  name: string
  type: CompanyType
  parentId: string | null  // ルート会社は null
  createdAt: string        // UTC ISO 8601
}

/** Closure table の 1 行。 */
export interface CompanyClosure {
  ancestorId: string
  descendantId: string
  depth: number
}

// =========================================
// API レスポンス型
// =========================================

export interface ApiUser {
  sub: string
  companyId: string
  role: RoleCode
}

/** POST /auth/login: 認証成功 */
export interface LoginSuccessResponse {
  idToken: string
  user: ApiUser
  permissions: PermissionCode[]
}

/** POST /auth/login や MFA フロー中: チャレンジ継続 */
export interface ChallengeResponse {
  challenge: 'SOFTWARE_TOKEN_MFA' | 'MFA_SETUP'
  session: string
}

/** POST /auth/mfa/setup: QRコード設定情報 */
export interface MfaSetupResponse {
  secretCode: string  // BASE32。クライアントで QR コード生成に使う
  session: string
}

export interface MeResponse {
  user: ApiUser
  permissions: PermissionCode[]
}

// =========================================
// シードデータ型（既存ハンドラーとの互換維持）
// TODO: Cognito完全移行後に削除する
// =========================================

export interface SeedPermission {
  id: string
  code: PermissionCode
  name: string
  createdAt: string
}

export interface SeedUser {
  id: string
  name: string
  email: string
  passwordPlain: string
  roleId: string
  createdAt: string
  updatedAt: string
}

export interface SeedRole {
  id: string
  code: RoleCode
  name: string
  createdAt: string
}

/** role_permissions テーブルの行。PK は (roleId, permissionId) の複合キー。 */
export interface SeedRolePermission {
  roleId: string
  permissionId: string
}

export interface FusionRecord {
  id: string
  projectId: string
  name: string
  status: 'SUCCESS' | 'FAIL'
  workerName: string
  startedAt: string   // UTC ISO 8601
  finishedAt: string  // UTC ISO 8601
  lat: number
  lng: number
  createdAt: string   // UTC ISO 8601
}

export interface ProjectRecord {
  id: string
  name: string
  description: string
  createdAt: string   // UTC ISO 8601
}
