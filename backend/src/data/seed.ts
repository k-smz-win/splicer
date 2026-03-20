import type {
  SeedUser,
  SeedRole,
  SeedPermission,
  SeedRolePermission,
  FusionRecord,
  ProjectRecord,
} from '../models/types'

/**
 * インメモリデータソース。DB 導入時はこのファイルをリポジトリ層に差し替える。
 * 各テーブルは backend-design.md のスキーマ定義に準拠している。
 *
 * @remarks
 * service 層のみがこのモジュールを import してよい。handler からの直接参照は禁止。
 */

// ---- roles ----

export const SEED_ROLES: SeedRole[] = [
  { id: 'role-001', code: 'SYS_ADMIN', name: 'システム管理者', createdAt: '2025-01-01T00:00:00Z' },
  { id: 'role-002', code: 'MANAGER',   name: 'マネージャー',   createdAt: '2025-01-01T00:00:00Z' },
  { id: 'role-003', code: 'USER',      name: '一般ユーザー',   createdAt: '2025-01-01T00:00:00Z' },
  { id: 'role-004', code: 'WORKER',    name: '作業者',         createdAt: '2025-01-01T00:00:00Z' },
]

// ---- permissions ----

export const SEED_PERMISSIONS: SeedPermission[] = [
  { id: 'perm-001', code: 'VIEW_USER',      name: 'ユーザー閲覧',     createdAt: '2025-01-01T00:00:00Z' },
  { id: 'perm-002', code: 'MANAGE_PROJECT', name: 'プロジェクト管理', createdAt: '2025-01-01T00:00:00Z' },
  { id: 'perm-003', code: 'VIEW_FUSION',    name: '融着データ閲覧',   createdAt: '2025-01-01T00:00:00Z' },
  { id: 'perm-004', code: 'EDIT_FUSION',    name: '融着データ編集',   createdAt: '2025-01-01T00:00:00Z' },
  { id: 'perm-005', code: 'VIEW_MAP',       name: '地図閲覧',         createdAt: '2025-01-01T00:00:00Z' },
]

// ---- role_permissions ----

export const SEED_ROLE_PERMISSIONS: SeedRolePermission[] = [
  // SYS_ADMIN: 全権限
  { roleId: 'role-001', permissionId: 'perm-001' },
  { roleId: 'role-001', permissionId: 'perm-002' },
  { roleId: 'role-001', permissionId: 'perm-003' },
  { roleId: 'role-001', permissionId: 'perm-004' },
  { roleId: 'role-001', permissionId: 'perm-005' },
  // MANAGER: MANAGE_PROJECT / VIEW_FUSION / EDIT_FUSION / VIEW_MAP
  { roleId: 'role-002', permissionId: 'perm-002' },
  { roleId: 'role-002', permissionId: 'perm-003' },
  { roleId: 'role-002', permissionId: 'perm-004' },
  { roleId: 'role-002', permissionId: 'perm-005' },
  // USER: VIEW_FUSION / VIEW_MAP
  { roleId: 'role-003', permissionId: 'perm-003' },
  { roleId: 'role-003', permissionId: 'perm-005' },
  // WORKER: VIEW_FUSION / EDIT_FUSION
  { roleId: 'role-004', permissionId: 'perm-003' },
  { roleId: 'role-004', permissionId: 'perm-004' },
]

// ---- users ----

export const SEED_USERS: SeedUser[] = [
  {
    id: 'user-001',
    name: '管理者 太郎',
    email: 'admin@example.com',
    passwordPlain: 'password',
    roleId: 'role-001',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'user-002',
    name: 'マネージャー 花子',
    email: 'manager@example.com',
    passwordPlain: 'password',
    roleId: 'role-002',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'user-003',
    name: 'ユーザー 一郎',
    email: 'user@example.com',
    passwordPlain: 'password',
    roleId: 'role-003',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'user-004',
    name: '作業者 二郎',
    email: 'worker@example.com',
    passwordPlain: 'password',
    roleId: 'role-004',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
]

// ---- fusion records ----

export const SEED_FUSIONS: FusionRecord[] = [
  {
    id: 'f-001',
    projectId: 'p-001',
    name: '心線接続 #001',
    status: 'SUCCESS',
    workerName: '田中 一郎',
    startedAt: '2025-04-01T01:00:00Z',
    finishedAt: '2025-04-01T01:05:30Z',
    lat: 35.6895,
    lng: 139.6917,
    createdAt: '2025-04-01T01:06:00Z',
  },
  {
    id: 'f-002',
    projectId: 'p-001',
    name: '心線接続 #002',
    status: 'FAIL',
    workerName: '佐藤 二郎',
    startedAt: '2025-04-01T02:10:00Z',
    finishedAt: '2025-04-01T02:14:00Z',
    lat: 35.6800,
    lng: 139.7700,
    createdAt: '2025-04-01T02:15:00Z',
  },
  {
    id: 'f-003',
    projectId: 'p-002',
    name: '心線接続 #003',
    status: 'SUCCESS',
    workerName: '鈴木 三郎',
    startedAt: '2025-05-10T00:30:00Z',
    finishedAt: '2025-05-10T00:36:00Z',
    lat: 35.6900,
    lng: 139.6900,
    createdAt: '2025-05-10T00:37:00Z',
  },
  {
    id: 'f-004',
    projectId: 'p-001',
    name: '心線接続 #004',
    status: 'SUCCESS',
    workerName: '田中 一郎',
    startedAt: '2025-04-02T01:00:00Z',
    finishedAt: '2025-04-02T01:04:00Z',
    lat: 35.6760,
    lng: 139.6500,
    createdAt: '2025-04-02T01:05:00Z',
  },
  {
    id: 'f-005',
    projectId: 'p-003',
    name: '心線接続 #005',
    status: 'SUCCESS',
    workerName: '高橋 四郎',
    startedAt: '2025-07-15T05:00:00Z',
    finishedAt: '2025-07-15T05:07:00Z',
    lat: 35.7020,
    lng: 139.7750,
    createdAt: '2025-07-15T05:08:00Z',
  },
]

// ---- projects ----

export const SEED_PROJECTS: ProjectRecord[] = [
  {
    id: 'p-001',
    name: '〇〇幹線ケーブル工事',
    description: '東京〜横浜間の光ファイバー敷設工事',
    createdAt: '2025-01-10T00:00:00Z',
  },
  {
    id: 'p-002',
    name: '△△ビル内配線工事',
    description: '新宿区△△ビル屋内LAN工事',
    createdAt: '2025-03-05T00:00:00Z',
  },
  {
    id: 'p-003',
    name: '□□地下鉄延伸工事',
    description: '地下鉄新線の通信設備工事',
    createdAt: '2025-06-20T00:00:00Z',
  },
]
