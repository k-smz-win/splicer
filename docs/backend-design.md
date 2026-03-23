# バックエンド設計

## このドキュメントの目的

Splicerバックエンドの設計方針・DB設計・API仕様を記録する。
実装の意図・判断根拠を残し、将来の変更コストを最小にする。

---

## 技術スタック

| 項目 | 採用技術 |
|---|---|
| 実行環境 | AWS Lambda + API Gateway |
| フレームワーク | Serverless Framework v3 |
| 言語 | Node.js 20 / TypeScript |
| 認証 | Amazon Cognito（IDトークン） |
| DB | PostgreSQL（RDS） |
| JWT検証 | aws-jwt-verify |

---

## 認証設計

### 認証方式

- **メール + パスワード** + **TOTP MFA（Google Authenticator等）**
- Cognitoの **IDトークン** をBearerトークンとして使用
  - `custom:company_id` / `custom:role` はIDトークンにのみ含まれる
  - アクセストークンではカスタム属性が取れないため **IDトークン必須**

### Cognito ユーザー属性

| 属性 | 型 | 説明 |
|---|---|---|
| `sub` | string | ユーザーID（主キー）。emailは変更される可能性があるため使用しない |
| `email` | string | ログイン識別子 |
| `custom:company_id` | string | 所属会社ID（FK → company.id） |
| `custom:role` | string | ロール（SYS_ADMIN / MANAGER / USER / WORKER） |

### TOTP MFA ログインフロー

```
POST /auth/login
  ↓
  ├─ challenge: MFA_SETUP（初回未設定）
  │     ↓
  │   POST /auth/mfa/setup    → { secretCode, session }
  │     ↓ クライアントでQRコード表示・スキャン
  │   POST /auth/mfa/verify-setup → { idToken, user, permissions }
  │
  ├─ challenge: SOFTWARE_TOKEN_MFA（設定済み）
  │     ↓
  │   POST /auth/mfa/challenge → { idToken, user, permissions }
  │
  └─ チャレンジなし → { idToken, user, permissions }
```

### MFA必須ポリシー

- SYS_ADMIN: **常にMFA必須**（変更不可）
- MANAGER / USER / WORKER: `company_settings` テーブルで **会社ごとに設定可能**

MFAの要否判定フロー:
```
ログイン時 → company_settings を参照 → ロールに応じたMFA設定を確認
                                        → 必須なら MFA チャレンジを発行
```

### 認証モード切替

```
AUTH_MODE=cognito（デフォルト）  Cognito IDトークン検証
AUTH_MODE=mock                  デモ用（本番起動不可）
```

Mockモードでは `?mockRole=MANAGER&mockCompanyId=xxx` または
`X-Mock-Role` / `X-Mock-Company-Id` ヘッダーで上書き可能。

---

## 権限設計

### 原則

**バックエンドが権限の唯一の正（Single Source of Truth）になる。**

```
フロントエンド  →  「何を表示するか」の制御のみ持つ
バックエンド    →  「何が許可されるか」の定義と検証を持つ
```

### ResolvedUser 型

```ts
interface ResolvedUser {
  sub: string        // Cognito sub（ユーザーID）
  companyId: string  // custom:company_id
  role: RoleCode     // custom:role
}
```

### ロールと権限のマッピング

| 権限コード | SYS_ADMIN | MANAGER | USER | WORKER |
|---|---|---|---|---|
| `VIEW_USER` | ✅ | | | |
| `MANAGE_PROJECT` | ✅ | ✅ | | |
| `VIEW_FUSION` | ✅ | ✅ | ✅ | ✅ |
| `EDIT_FUSION` | ✅ | ✅ | | ✅ |
| `VIEW_MAP` | ✅ | ✅ | ✅ | |
| `MANAGE_COMPANY` | ✅ | | | |

権限解決は `permissionService.resolve(role: RoleCode)` が担う。
フロントエンドに ROLE_PERMISSIONS を持たせてはならない。

---

## DB設計

### 会社階層（Closure Table）

会社はツリー構造（例: 親会社 → 代理店 → 顧客）。
**Closure Table** を採用し、再帰SQLなしで高速な階層クエリを実現する。

#### company

| カラム | 型 | 説明 |
|---|---|---|
| id | UUID | PK |
| name | VARCHAR | 会社名 |
| type | VARCHAR | `ADMIN` / `SALES` / `AGENCY` / `CUSTOMER` |
| parent_id | UUID NULL | FK → company.id。ルート会社は NULL |
| created_at | TIMESTAMPTZ | UTC |

#### company_closure

| カラム | 型 | 説明 |
|---|---|---|
| ancestor_id | UUID | FK → company.id |
| descendant_id | UUID | FK → company.id |
| depth | INT | 0=自己参照、1=直接の親子、2=孫... |

**PK**: `(ancestor_id, descendant_id)`
**Index**: `ancestor_id`、`descendant_id` 個別にインデックスを貼る

##### Closure table 更新ロジック（会社作成時）

```sql
-- 1. 自己参照
INSERT INTO company_closure VALUES (new_id, new_id, 0);

-- 2. 親の祖先経路をコピー（再帰なし）
INSERT INTO company_closure (ancestor_id, descendant_id, depth)
SELECT ancestor_id, new_id, depth + 1
FROM company_closure
WHERE descendant_id = parent_id;
```

##### クエリ例

```sql
-- 配下会社を取得（再帰SQL不要）
SELECT c.* FROM company c
JOIN company_closure cc ON c.id = cc.descendant_id
WHERE cc.ancestor_id = :companyId AND cc.depth > 0
ORDER BY cc.depth;

-- 祖先会社を取得
SELECT c.* FROM company c
JOIN company_closure cc ON c.id = cc.ancestor_id
WHERE cc.descendant_id = :companyId AND cc.depth > 0
ORDER BY cc.depth;

-- 権限チェック（自分の配下か？）
SELECT EXISTS(
  SELECT 1 FROM company_closure
  WHERE ancestor_id = :myCompanyId AND descendant_id = :targetCompanyId
);
```

---

### 設定管理

SYS_ADMIN が設定画面から会社・ロール・ユーザー単位の設定を一元管理する。

#### company_settings（会社×ロール単位）

```sql
CREATE TABLE company_settings (
  company_id  UUID NOT NULL REFERENCES companies(id),
  role        TEXT NOT NULL,   -- 'MANAGER' | 'USER' | 'WORKER'
                               -- ※ SYS_ADMIN は常にMFA必須のため対象外
  key         TEXT NOT NULL,   -- 設定の種類（例: 'mfa_required'）
  value       JSONB NOT NULL,  -- 設定値（boolean / number / string など）
  PRIMARY KEY (company_id, role, key)
);
```

##### 設定キー一覧（現時点）

| key | value型 | デフォルト | 説明 |
|---|---|---|---|
| `mfa_required` | boolean | `true` | MFA必須/不要 |

> 新しい設定はスキーマ変更なし・`key` を追加するだけで対応できる。

#### user_settings（ユーザー個別オーバーライド）

```sql
CREATE TABLE user_settings (
  cognito_sub  TEXT NOT NULL,  -- Cognito sub（ユーザーID）
  key          TEXT NOT NULL,
  value        JSONB NOT NULL,
  PRIMARY KEY (cognito_sub, key)
);
```

`company_settings` の値を個別に上書きしたい場合に使用する。
レコードが存在しない場合は `company_settings` の値が適用される。

#### 設定解決の優先順位

```
user_settings（個別）
  ↓ レコードなし
company_settings（会社×ロール）
  ↓ レコードなし
システムデフォルト（mfa_required: true）
```

##### 取得クエリ例

```sql
-- あるユーザーの mfa_required を解決する
-- 優先: user_settings → company_settings → デフォルト

SELECT COALESCE(
  (SELECT value FROM user_settings
   WHERE cognito_sub = :sub AND key = 'mfa_required'),
  (SELECT value FROM company_settings
   WHERE company_id = :companyId AND role = :role AND key = 'mfa_required'),
  'true'::jsonb
) AS mfa_required;
```

---

## API仕様

### 認証系

#### POST /api/auth/login

```json
// リクエスト
{ "email": "user@example.com", "password": "..." }

// 成功（MFA不要）
{ "idToken": "eyJ...", "user": { "sub": "uuid", "companyId": "uuid", "role": "MANAGER" }, "permissions": ["MANAGE_PROJECT", ...] }

// MFA設定済み → チャレンジ
{ "challenge": "SOFTWARE_TOKEN_MFA", "session": "..." }

// 初回MFA未設定 → セットアップ案内
{ "challenge": "MFA_SETUP", "session": "..." }
```

#### POST /api/auth/mfa/setup

```json
// リクエスト
{ "session": "..." }
// レスポンス
{ "secretCode": "BASE32_SECRET", "session": "..." }
```

> クライアントは `otpauth://totp/{label}?secret={secretCode}&issuer={issuer}` でQRコードを生成する。

#### POST /api/auth/mfa/verify-setup

```json
// リクエスト
{ "email": "user@example.com", "session": "...", "code": "123456" }
// レスポンス（セットアップ完了 + ログイン完了）
{ "idToken": "eyJ...", "user": {...}, "permissions": [...] }
```

#### POST /api/auth/mfa/challenge

```json
// リクエスト
{ "email": "user@example.com", "session": "...", "code": "123456" }
// レスポンス
{ "idToken": "eyJ...", "user": {...}, "permissions": [...] }
```

#### GET /api/auth/me

```json
// レスポンス
{ "user": { "sub": "uuid", "companyId": "uuid", "role": "MANAGER" }, "permissions": [...] }
```

---

### 会社管理系

全エンドポイントで `MANAGE_COMPANY` 権限が必要（SYS_ADMINのみ）。
SYS_ADMIN以外はリクエスト不可。

#### POST /api/companies

```json
// リクエスト
{ "name": "株式会社〇〇", "type": "CUSTOMER", "parentId": "uuid" }
// レスポンス（201相当、statusCode: 200）
{ "id": "uuid", "name": "株式会社〇〇", "type": "CUSTOMER", "parentId": "uuid", "createdAt": "..." }
```

#### GET /api/companies/{id}/descendants

指定会社の配下一覧（depth > 0）。

#### GET /api/companies/{id}/ancestors

指定会社の祖先一覧（depth > 0、直近の親が先頭）。

#### GET /api/companies/me/descendants

ログインユーザーの所属会社の配下一覧。`actor.companyId` を使用。

---

### 設定系

全エンドポイントで `MANAGE_COMPANY` 権限が必要（SYS_ADMINのみ）。

#### GET /api/companies/{id}/settings

会社の全ロール×全キーの設定を返す。

```json
{
  "companyId": "uuid",
  "settings": {
    "MANAGER": { "mfa_required": true },
    "USER":    { "mfa_required": true },
    "WORKER":  { "mfa_required": false }
  }
}
```

#### PUT /api/companies/{id}/settings/{role}/{key}

特定ロール・キーの設定を更新する（upsert）。

```json
// リクエスト
{ "value": false }
// レスポンス
{ "companyId": "uuid", "role": "WORKER", "key": "mfa_required", "value": false }
```

#### GET /api/users/{sub}/settings

ユーザー個別設定を返す。存在しないキーは `company_settings` の値が適用される。

```json
{
  "sub": "uuid",
  "settings": {
    "mfa_required": true   // user_settings にあればその値、なければ company_settings の値
  }
}
```

#### PUT /api/users/{sub}/settings/{key}

ユーザー個別設定を更新する（upsert）。

```json
// リクエスト
{ "value": false }
```

#### DELETE /api/users/{sub}/settings/{key}

個別設定を削除し、会社設定に戻す。

---

## アーキテクチャ

### ディレクトリ構成

```
src/
  auth/
    types.ts              IAuthService インターフェース、AuthError
    cognitoAuthService.ts Cognito IDトークン検証（aws-jwt-verify, tokenUse:'id'）
    mockAuthService.ts    Mock認証（query/headerで上書き可）
    index.ts              createAuthService() + resolveAuthenticatedUser()
  handlers/
    auth.ts               認証・MFAハンドラー
    companies.ts          会社管理ハンドラー
    settings.ts           設定管理ハンドラー（会社設定・ユーザー設定）
    fusion.ts
    projects.ts
  repositories/
    ICompanyRepository.ts            インターフェース
    inMemoryCompanyRepository.ts     InMemory実装（概念確認用）
    ISettingsRepository.ts           インターフェース
    inMemorySettingsRepository.ts    InMemory実装（概念確認用）
    # postgresCompanyRepository.ts   ← PostgreSQL実装（未実装）
    # postgresSettingsRepository.ts  ← PostgreSQL実装（未実装）
  services/
    companyService.ts     会社ビジネスロジック・権限チェック
    settingsService.ts    設定解決ロジック（優先順位: user → company → デフォルト）
    permissionService.ts  RoleCode → PermissionCode[] 解決
    authService.ts        @deprecated（JWT旧実装、廃止予定）
  models/
    types.ts              全型定義
  middleware/
    withAuth.ts           @deprecated（新ハンドラーは使用しない）
    withToken.ts          @deprecated（新ハンドラーは使用しない）
  utils/
    response.ts           HTTPレスポンス共通ヘルパー
```

### handler での認証パターン

```ts
// ✅ 新方式（handler内で関数呼び出し）
export const handler: APIGatewayProxyHandler = async (event) => {
  const user = await resolveAuthenticatedUser(event)   // 認証
  const permissions = permissionService.resolve(user.role)
  if (!permissions.includes('MANAGE_PROJECT')) return forbidden()
  // ビジネスロジック
}

// ❌ 旧方式（@deprecated）
export const handler = withAuth('MANAGE_PROJECT', async (event, user) => { ... })
```

---

## 環境変数

| 変数 | 説明 | 必須 |
|---|---|---|
| `AUTH_MODE` | `cognito` or `mock`（デフォルト: cognito） | - |
| `COGNITO_USER_POOL_ID` | CognitoユーザープールID | cognito時 |
| `COGNITO_CLIENT_ID` | CognitoアプリクライアントID | cognito時 |
| `AWS_REGION` | AWSリージョン（デフォルト: ap-northeast-1） | - |
| `NODE_ENV` | `development` or `production` | - |

> `AUTH_MODE=mock` かつ `NODE_ENV=production` の場合は起動時に即エラー。

---

## フロントエンドへの影響

| ファイル | 変更内容 |
|---|---|
| `features/auth/api.ts` | `loginApi` をCognito MFAフロー対応に変更 |
| `contexts/AuthContext.tsx` | `user.id/name/email` → `user.sub/companyId/role` に変更 |
| `constants/roles.ts` | `ROLE_PERMISSIONS` を削除（権限はAPIから取得） |

```ts
// 移行後の AuthContext（変更イメージ）
interface AuthContextValue {
  user: { sub: string; companyId: string; role: RoleCode } | null
  permissions: PermissionCode[]
  isAuthenticated: boolean
  hasPermission: (permission: PermissionCode) => boolean
}
// hasPermission の実装
const hasPermission = (p: PermissionCode) => permissions.includes(p)
```

---

## 将来拡張メモ

| 拡張内容 | 概要 |
|---|---|
| **PostgreSQL実装** | `ICompanyRepository` / `ISettingsRepository` を実装した Postgres クラスを作成して差し替え |
| **設定の継承** | 親会社の `company_settings` を配下に継承するロジック（Closure table で最近接祖先を検索） |
| **プロジェクト単位の権限** | `project_user_permissions` テーブルを追加 |
| **MFA強制ロジック** | ログイン時に `settingsService.resolveSettingValue` で `mfa_required` を確認し、必須なのにスキップされた場合はトークンを無効化 |
