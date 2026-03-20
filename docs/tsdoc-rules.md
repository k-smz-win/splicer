# TSDoc ルール

> **コメントを書く前に必ずこのドキュメントを読むこと。**

---

## 最重要原則

**型・名前・コードから読み取れない情報のみを書く。**

これに該当しないなら書かない。迷ったら書かない。

---

## 書くべきもの

| 種類 | 書く内容 |
|---|---|
| 設計上の制約 | 「Provider 外で使用禁止」「ルートで一度だけ配置」など |
| throw する関数 | `@throws` で条件を明記 |
| モック実装 | `@remarks` で将来の差し替え先を明記 |
| 非自明な挙動 | 「未認証時は常に false」「省略時は全件返す」など |
| 将来の変更境界 | 「この関数のみを差し替える」など |
| `string` 型の制約 | UTC ISO 8601 など型だけでは伝わらないフォーマット |

## 書いてはいけないもの

| 禁止パターン | 例 |
|---|---|
| 型を日本語に言い換えるだけ | `/** ユーザー情報 */ user: User` |
| 関数名をそのまま説明 | `/** ログアウトする */ logout()` |
| React 慣習として自明なもの | `loading`, `error`, `children` |
| 命名で完結するフィールド | `id`, `name`, `email` |
| ファイル先頭の概要コメント | ファイル名とディレクトリが伝えている |
| `@returns void` | 不要 |
| `@param user ユーザー` | 型の言い換えのため不要 |

---

## 判断チェックリスト

コメントを書く前に以下をすべて確認する。
どれか一つでも「No」なら書かない。

- [ ] 型シグネチャを読んだ後でも伝わらない情報か
- [ ] 関数・変数名を読んだ後でも伝わらない情報か
- [ ] 設計意図・制約・差し替えポイントのいずれかを含むか
- [ ] 書いた後にコメントを削除してもコードが理解できないか

---

## このプロジェクトの対象ファイル

### 書く（設計意図・制約・差し替え境界が存在する）

| ファイル | 対象 |
|---|---|
| `contexts/AuthContext.tsx` | `AuthContextValue`, `hasPermission`, `AuthContext`, `AuthProvider`, `useAuth` |
| `constants/permissions.ts` | `Permission` オブジェクト |
| `constants/roles.ts` | `ROLE_PERMISSIONS` |
| `features/auth/api.ts` | `loginApi`（`@remarks` + `@throws`） |
| `features/fusion/api.ts` | `fetchFusions`（`@remarks` + `@param` 省略時の挙動） |
| `features/project/api.ts` | `fetchProjects`（`@remarks`） |
| `components/ProtectedRoute.tsx` | コンポーネント（`PermissionGate` との使い分け） |
| `components/PermissionGate.tsx` | コンポーネント（`ProtectedRoute` との使い分け） |
| `utils/date.ts` | 全関数（UTC on wire の設計方針） |
| `types/index.ts` | `Fusion`（フラット構造の意図）, `MapMarker`（変換層の明示）, 日時フィールド |
| `features/auth/hooks.ts` | `useLogin`（Page からロジックを切り離す設計意図） |
| `features/map/hooks.ts` | `useFusionMarkers`（依存分離の設計意図） |

### 書かない

- `pages/` 配下（ロジックを持たない設計のため）
- `components/Layout.tsx`（補助コンポーネント含む）
- `components/MapView.tsx`
- `features/project/hooks.ts`, `features/fusion/hooks.ts`（型で完結）
- `i18n/`

---

## TSDoc タグ早見表

```ts
/**
 * 設計意図を1〜2文で。処理説明はしない。
 *
 * @remarks
 * 将来の差し替えポイントや注意事項。モック実装の場合に必須。
 *
 * @param name 型の言い換えはしない。自明でない挙動のみ書く。
 * @returns 型の説明ではなく「何を意味するか」を書く。
 * @throws {Error} どの条件で throw するか。
 */
```

---

## NG パターン集

```ts
// NG: 関数名の言い換え
/** ログイン処理を行う */
export function useLogin() {}

// NG: 型の日本語訳
/** @param credentials ログイン情報 */

// NG: 自明な state
/** ローディング状態 */
const [loading, setLoading] = useState(false)

// NG: @returns に型を書くだけ
/** @returns boolean */
hasPermission: (permission: Permission) => boolean

// NG: ファイル先頭コメント
/** 認証関連のHookを定義するファイル */
```

---

## 権限追加時の手順

1. `constants/permissions.ts` に権限を追加する
2. `constants/roles.ts` の `ROLE_PERMISSIONS` に反映する
3. 必要に応じて `ProtectedRoute` または `PermissionGate` で制御を追加する
