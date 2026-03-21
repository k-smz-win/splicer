# バックエンド設計

## このドキュメントの目的

Splicerバックエンドの設計方針・DB設計・API仕様を記録する。
将来のCognito移行やDB本格導入を見据えた設計の意図を残しておく。

---

## 現在の実装状況

```
現在（モック）                     将来（本格実装）
────────────────────              ──────────────────────
Lambda + ハードコードデータ    →   Lambda + RDS（PostgreSQL）
JWTはローカル発行              →   Cognito認証に移行
権限マッピングはフロントに存在  →   role_permissionsテーブルで管理
```

> **なぜこの段階で設計を固めるか**
> フロントエンドとバックエンドのインターフェース（APIレスポンス形式）を今のうちに確定しておくことで、将来の移行コストを最小にする。

---

## 設計の核心：権限モデル

### 原則

**バックエンドが権限の唯一の正（Single Source of Truth）になる。**

```
フロントエンド  →  「何を表示するか」の制御のみ持つ
バックエンド    →  「何が許可されるか」の定義と検証を持つ
```

### 現在との違い

| | 現在（モック） | 将来（本格実装） |
|---|---|---|
| 権限マッピングの場所 | `constants/roles.ts`（フロント） | `role_permissions` テーブル（DB） |
| フロントへの渡し方 | ロールコードのみ | 解決済みの `permissions[]` 配列 |
| 権限追加の方法 | フロントのコードを変更 | DBのレコードを追加するだけ |

移行時に `constants/roles.ts` の `ROLE_PERMISSIONS` は削除する。

---

## DB設計

### ER図

```
users ──── roles ──── role_permissions ──── permissions
  │                         │
  │                   (多対多の中間テーブル)
  └── role_id で roles を参照
```

### テーブル定義

#### users

| カラム | 型 | 説明 |
|---|---|---|
| id | UUID | PK |
| name | VARCHAR | 表示名 |
| email | VARCHAR | ログイン識別子（UNIQUE） |
| cognito_sub | VARCHAR | Cognito連携時に使用 |
| role_id | UUID | FK → roles.id |
| created_at | TIMESTAMPTZ | UTC |
| updated_at | TIMESTAMPTZ | UTC |

> `password_hash` を持たない設計にしている。Cognito導入前の過渡期はJWTをローカル発行するが、`cognito_sub` で突き合わせる設計を最初から前提にすることでCognito移行時の変更を最小にする。

#### roles

| カラム | 型 | 説明 |
|---|---|---|
| id | UUID | PK |
| code | VARCHAR | `SYS_ADMIN` / `MANAGER` / `USER` / `WORKER` |
| name | VARCHAR | 表示用ラベル |
| created_at | TIMESTAMPTZ | UTC |

#### permissions

| カラム | 型 | 説明 |
|---|---|---|
| id | UUID | PK |
| code | VARCHAR | `VIEW_USER` / `MANAGE_PROJECT` など |
| name | VARCHAR | 表示用ラベル |
| created_at | TIMESTAMPTZ | UTC |

#### role_permissions（中間テーブル）

ロールと権限の多対多マッピング。**このテーブルが権限の実体。**

| カラム | 型 | 説明 |
|---|---|---|
| role_id | UUID | FK → roles.id |
| permission_id | UUID | FK → permissions.id |

PKは `(role_id, permission_id)` の複合キー。

### 初期データ（シードデータ）

`roles` と `permissions` は固定値なのでシード時に一括投入する。

```sql
-- roles
INSERT INTO roles (code, name) VALUES
  ('SYS_ADMIN', 'システム管理者'),
  ('MANAGER',   'マネージャー'),
  ('USER',      '一般ユーザー'),
  ('WORKER',    '作業者');

-- permissions
INSERT INTO permissions (code, name) VALUES
  ('VIEW_USER',       'ユーザー閲覧'),
  ('MANAGE_PROJECT',  'プロジェクト管理'),
  ('VIEW_FUSION',     '融着データ閲覧'),
  ('EDIT_FUSION',     '融着データ編集'),
  ('VIEW_MAP',        '地図閲覧');

-- role_permissions（現在のフロント ROLE_PERMISSIONS と同じマッピング）
-- SYS_ADMIN: 全権限
-- MANAGER:   MANAGE_PROJECT / VIEW_FUSION / EDIT_FUSION / VIEW_MAP
-- USER:      VIEW_FUSION / VIEW_MAP
-- WORKER:    VIEW_FUSION / EDIT_FUSION
```

---

## API仕様

### POST /api/auth/login

**目的**: ログイン認証。成功時にユーザー情報と解決済みの権限リストを返す。

```json
// リクエスト
{
  "email": "yamada@example.com",
  "password": "password"
}

// レスポンス（成功時 200）
{
  "user": {
    "id": "uuid",
    "name": "山田 太郎",
    "email": "yamada@example.com",
    "role": "MANAGER"
  },
  "permissions": [
    "MANAGE_PROJECT",
    "VIEW_FUSION",
    "EDIT_FUSION",
    "VIEW_MAP"
  ]
}
```

> `permissions[]` はバックエンドが `role_permissions` テーブルをJOINして解決した結果。
> フロントはロールコードを持つ必要なく、`permissions[]` だけで表示制御が完結する。

---

### GET /api/auth/me

**目的**: ページリロード・セッション復元時に現在のユーザー情報を再取得する。

- Authorization ヘッダーにJWTが必要
- レスポンス形式は `/api/auth/login` と同じ

---

### GET /api/fusion

**目的**: 融着データ一覧の取得。

---

### GET /api/projects

**目的**: プロジェクト一覧の取得。

---

## フロントエンドへの影響（移行時の変更箇所）

本格実装への移行時に変更が必要なファイルは最小限になるよう設計されている。

| ファイル | 変更内容 |
|---|---|
| `features/auth/api.ts` の `loginApi` | モック実装を実API呼び出しに差し替える |
| `contexts/AuthContext.tsx` | `permissions` を受け取れるよう型を拡張 |
| `constants/roles.ts` | `ROLE_PERMISSIONS` を削除 |

```ts
// 移行後の AuthContext（変更イメージ）
interface AuthContextValue {
  user: User | null
  permissions: Permission[]     // APIから受け取った権限リスト
  isAuthenticated: boolean
  login: (user: User, permissions: Permission[]) => void
  logout: () => void
  hasPermission: (permission: Permission) => boolean
}

// hasPermission の実装が ROLE_PERMISSIONS 参照から配列検索に変わる
const hasPermission = (permission: Permission) =>
  permissions.includes(permission)
```

---

## 将来拡張メモ

| 拡張内容 | 概要 |
|---|---|
| **プロジェクト単位の権限** | `project_user_permissions` テーブルを追加してプロジェクトごとに権限を付与できる設計にする |
| **Cognito連携** | `cognito_sub` をusersテーブルに持ち、JWTの `sub` クレームで突き合わせる。`loginApi` をCognito SDK呼び出しに差し替えるだけで対応できる設計 |
| **RDS移行** | 現在はハードコードデータ。RDS導入時はシードデータをそのまま投入する |
