export const Role = {
  SYS_ADMIN: 'SYS_ADMIN',
  MANAGER: 'MANAGER',
  USER: 'USER',
  WORKER: 'WORKER',
} as const

export type Role = (typeof Role)[keyof typeof Role]

/**
 * ロールと権限のマッピングはバックエンドの role_permissions テーブルで管理する。
 * フロントは /api/auth/login・/api/auth/me が返す permissions[] のみを使用すること。
 * ROLE_PERMISSIONS をフロントに定義することは禁止。
 */
