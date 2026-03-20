# バックエンド設計メモ

フロントエンドの将来対応（Cognito・API移行）を見据えた設計の整理。

---

## 権限モデルの考え方

バックエンドが権限の**唯一の正（Single Source of Truth）**になる。

```
フロントは「何を表示するか」の制御のみ持つ
バックエンドは「何が許可されるか」の定義と検証を持つ
```

現在フロントの `ROLE_PERMISSIONS`（roles.ts）に置いているマッピングは、
バックエンド実装後に `role_permissions` テーブルへ移行し、フロント側は削除する。

---

## テーブル設計

### users

| カラム | 型 | 説明 |
|---|---|---|
| id | UUID | PK |
| name | VARCHAR | 表示名 |
| email | VARCHAR | ログイン識別子（UNIQUE） |
| cognito_sub | VARCHAR | Cognito 連携時に使用。パスワードは Cognito 管理 |
| role_id | UUID | FK → roles.id |
| created_at | TIMESTAMPTZ | UTC |
| updated_at | TIMESTAMPTZ | UTC |

> Cognito 導入前は `password_hash` カラムを追加してもよいが、
> 最初から Cognito を前提に設計するなら `cognito_sub` のみで足りる。

---

### roles

| カラム | 型 | 説明 |
|---|---|---|
| id | UUID | PK |
| code | VARCHAR | `SYS_ADMIN` / `MANAGER` / `USER` / `WORKER` |
| name | VARCHAR | 表示用ラベル |
| created_at | TIMESTAMPTZ | UTC |

---

### permissions

| カラム | 型 | 説明 |
|---|---|---|
| id | UUID | PK |
| code | VARCHAR | `VIEW_USER` / `MANAGE_PROJECT` など |
| name | VARCHAR | 表示用ラベル |
| created_at | TIMESTAMPTZ | UTC |

---

### role_permissions（authority テーブル）

ロールと権限の多対多マッピング。このテーブルが権限の実体。

| カラム | 型 | 説明 |
|---|---|---|
| role_id | UUID | FK → roles.id |
| permission_id | UUID | FK → permissions.id |

PK は `(role_id, permission_id)` の複合キー。

---

## ER 図（概略）

```
users ──── roles ──── role_permissions ──── permissions
```

---

## 初期データ（マスターデータ）

roles と permissions は固定値なのでシードデータとして投入する。

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

## API 設計

### POST /auth/login

ログイン成功時にユーザー情報と**解決済みの権限リスト**を返す。
フロントは `permissions[]` を受け取り、`ROLE_PERMISSIONS` の代わりに使う。

```json
// レスポンス
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

> バックエンド側で `role_permissions` テーブルを JOIN して権限コードの配列に変換する。
> フロントはロールを知る必要はなく、`permissions[]` だけで表示制御が完結する。

---

### GET /auth/me

セッション復元・ページリロード時に現在のユーザー情報を再取得する。
レスポンス形式は `/auth/login` と同じ。

---

## フロントエンド移行時の変更箇所

バックエンドが実装されたときに変更が必要なフロントのファイルは1箇所のみ。

| ファイル | 変更内容 |
|---|---|
| `features/auth/api.ts` の `loginApi` | モック実装を実 API 呼び出しに差し替える |

```ts
// 移行後の AuthContext（変更イメージ）
interface AuthContextValue {
  user: User | null
  permissions: Permission[]     // 追加：API から受け取った権限リスト
  isAuthenticated: boolean
  login: (user: User, permissions: Permission[]) => void
  logout: () => void
  hasPermission: (permission: Permission) => boolean
}

// hasPermission の実装が ROLE_PERMISSIONS 参照から配列検索に変わる
const hasPermission = (permission: Permission) =>
  permissions.includes(permission)
```

`ROLE_PERMISSIONS`（roles.ts）はこの移行時に削除する。

---

## 将来拡張メモ

- **プロジェクト単位の権限**：現在はロール単位だが、将来は `project_user_permissions` テーブルを追加してプロジェクトごとに権限を付与できる設計にする
- **Cognito 連携**：`cognito_sub` を users テーブルに持ち、JWT の `sub` クレームで突き合わせる。`loginApi` を Cognito SDK 呼び出しに差し替えるだけでよい設計にしてある
