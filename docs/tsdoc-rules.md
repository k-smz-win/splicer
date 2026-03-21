# TSDoc ルール

> **コメントを書く前に必ずこのドキュメントを確認すること。**

---

## 最重要原則

**型・名前・コードから読み取れない情報のみを書く。**

それ以外は書かない。迷ったら書かない。

> **なぜこのルールか**
> 冗長なコメントはコードと二重管理になり、ズレたときに誤解を生む。
> 「何をするか」はコードが語る。コメントは「なぜ」「どんな制約があるか」を語る。

---

## 書くべきもの・書かないもの

### 書くべきもの

| 種類 | 書く内容 | 例 |
|---|---|---|
| 設計上の制約 | 使用場所・配置ルールの制限 | 「Provider外で使用禁止」「ルートで一度だけ配置」 |
| throwする関数 | `@throws` で条件を明記 | 「401のとき throw する」 |
| モック実装 | `@remarks` で将来の差し替え先を明記 | 「本番移行時は実APIに差し替える」 |
| 非自明な挙動 | 名前から推測できない動作 | 「未認証時は常に false」「省略時は全件返す」 |
| 将来の変更境界 | どこを差し替えればよいか | 「この関数のみを差し替える」 |
| 型だけでは伝わらない制約 | フォーマット・前提条件 | `string` 型だが UTC ISO 8601 形式に限定 |

### 書いてはいけないもの

| 禁止パターン | NG例 | 理由 |
|---|---|---|
| 型を日本語に言い換えるだけ | `/** ユーザー情報 */ user: User` | 型名が全て語っている |
| 関数名をそのまま説明 | `/** ログアウトする */ logout()` | 関数名が全て語っている |
| React慣習として自明なもの | `loading`, `error`, `children` | Reactを知っていれば自明 |
| 命名で完結するフィールド | `id`, `name`, `email` | 説明不要 |
| ファイル先頭の概要コメント | `/** 認証関連のHookを定義するファイル */` | ファイル名とディレクトリが伝えている |
| `@returns void` | — | 不要 |
| `@param user ユーザー` | — | 型の言い換えのため不要 |

---

## 書く前のチェックリスト

以下を**すべて満たす場合のみ**コメントを書く。どれか一つでもNoなら書かない。

- [ ] 型シグネチャを読んだ後でも伝わらない情報か
- [ ] 関数・変数名を読んだ後でも伝わらない情報か
- [ ] 設計意図・制約・差し替えポイントのいずれかを含むか
- [ ] コメントを削除してもコードが理解できないか（Noなら書かない）

---

## TSDocタグ早見表

```ts
/**
 * 設計意図を1〜2文で。処理説明はしない。
 *
 * @remarks
 * 将来の差し替えポイントや注意事項。モック実装の場合に必須。
 *
 * @param name 型の言い換えはしない。自明でない挙動のみ書く。
 * @returns 型の説明ではなく「何を意味するか」を書く。
 * @throws {Error} どの条件でthrowするか。
 */
```

---

## 具体例

### OK パターン

```ts
/**
 * 認証コンテキストを取得する。
 * AuthProvider の外で呼び出した場合は例外をスローする。
 *
 * @throws {Error} AuthProvider の外で使用した場合
 */
export function useAuth(): AuthContextValue { ... }
```

```ts
/**
 * ログインAPIを呼び出し、ユーザー情報と権限リストを返す。
 *
 * @remarks
 * 現在はハードコードデータを返すモック実装。
 * バックエンド本格稼働後はこの関数のみ実APIに差し替える。
 *
 * @throws {Error} 認証失敗時（401）
 */
export async function loginApi(credentials: LoginCredentials): Promise<LoginResponse> { ... }
```

```ts
/**
 * ページ単位のルート保護に使う。
 * UI要素の出し分けには PermissionGate を使うこと。
 */
export function ProtectedRoute({ ... }: Props) { ... }
```

### NG パターン

```ts
// NG: 関数名の言い換え
/** ログイン処理を行う */
export function useLogin() {}

// NG: 型の日本語訳
/** @param credentials ログイン情報 */

// NG: 自明なstate
/** ローディング状態 */
const [loading, setLoading] = useState(false)

// NG: @returns に型を書くだけ
/** @returns boolean */
hasPermission: (permission: Permission) => boolean

// NG: ファイル先頭コメント
/** 認証関連のHookを定義するファイル */
```

---

## このプロジェクトの対象ファイル

### コメントを書くファイル

設計意図・制約・差し替え境界が存在するファイルのみ対象。

| ファイル | コメントを書く対象 | 主なタグ |
|---|---|---|
| `contexts/AuthContext.tsx` | `AuthContextValue`, `hasPermission`, `AuthProvider`, `useAuth` | `@throws`, `@remarks` |
| `constants/permissions.ts` | `Permission` オブジェクト | — |
| `constants/roles.ts` | `ROLE_PERMISSIONS` | `@remarks`（移行時に削除予定） |
| `features/auth/api.ts` | `loginApi` | `@remarks`（モック）, `@throws` |
| `features/fusion/api.ts` | `fetchFusions` | `@remarks`, `@param`（省略時の挙動） |
| `features/project/api.ts` | `fetchProjects` | `@remarks` |
| `components/ProtectedRoute.tsx` | コンポーネント | `PermissionGate` との使い分け |
| `components/PermissionGate.tsx` | コンポーネント | `ProtectedRoute` との使い分け |
| `utils/date.ts` | 全関数 | UTC on wire の設計方針 |
| `types/index.ts` | `Fusion`, `MapMarker`, 日時フィールド | フラット構造の意図・変換層の明示 |
| `features/auth/hooks.ts` | `useLogin` | Pageからロジックを切り離す設計意図 |
| `features/map/hooks.ts` | `useFusionMarkers` | 依存分離の設計意図 |

### コメントを書かないファイル

| ファイル・ディレクトリ | 理由 |
|---|---|
| `pages/` 配下 | ロジックを持たない設計のため |
| `components/Layout.tsx` | 補助コンポーネントのため |
| `components/MapView.tsx` | — |
| `features/project/hooks.ts`, `features/fusion/hooks.ts` | 型で完結するため |
| `i18n/` | — |

---

## 権限追加時の手順

1. `constants/permissions.ts` に権限コードを追加する
2. `constants/roles.ts` の `ROLE_PERMISSIONS` に反映する
3. 必要に応じて `ProtectedRoute` または `PermissionGate` で制御を追加する

> バックエンド本格稼働後はDBのシードデータ（`role_permissions` テーブル）を変更するだけになる。フロントのコード変更は不要。
