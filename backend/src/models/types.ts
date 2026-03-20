/** ロールの識別コード。roles テーブルの code カラムに対応する。 */
export type RoleCode = 'SYS_ADMIN' | 'MANAGER' | 'USER' | 'WORKER'

/**
 * 権限の識別コード。permissions テーブルの code カラムに対応する。
 * フロントエンドの Permission enum と同じ文字列値にすること。
 * 追加時は seed.ts の permissions / role_permissions も更新する。
 */
export type PermissionCode =
  | 'VIEW_USER'
  | 'MANAGE_PROJECT'
  | 'VIEW_FUSION'
  | 'EDIT_FUSION'
  | 'VIEW_MAP'

// ---- 内部型（DB 行に対応） ----

export interface SeedUser {
  id: string
  name: string
  email: string
  /** @remarks Cognito 移行時に削除。cognito_sub カラムに差し替える。 */
  passwordPlain: string
  roleId: string     // FK → roles.id
  createdAt: string  // UTC ISO 8601
  updatedAt: string  // UTC ISO 8601
}

export interface SeedRole {
  id: string
  code: RoleCode
  name: string
  createdAt: string  // UTC ISO 8601
}

export interface SeedPermission {
  id: string
  code: PermissionCode
  name: string
  createdAt: string  // UTC ISO 8601
}

/** role_permissions テーブルの行。PK は (roleId, permissionId) の複合キー。 */
export interface SeedRolePermission {
  roleId: string       // FK → roles.id
  permissionId: string // FK → permissions.id
}

// ---- 認証コンテキスト内部型 ----

/**
 * authService が返すユーザー情報。
 * API レスポンス型（ApiUser）と異なり roleId を保持し、permissionService に渡せる。
 */
export interface ResolvedUser {
  id: string
  name: string
  email: string
  role: RoleCode   // API レスポンス用ロールコード
  roleId: string   // permissionService.resolve() に渡す FK
}

// ---- API レスポンス型 ----

export interface ApiUser {
  id: string
  name: string
  email: string
  role: RoleCode
}

export interface LoginResponse {
  user: ApiUser
  permissions: PermissionCode[]
  token: string
}

export interface MeResponse {
  user: ApiUser
  permissions: PermissionCode[]
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
