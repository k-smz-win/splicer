import jwt from 'jsonwebtoken'
import { SEED_USERS, SEED_ROLES } from '../data/seed'
import type { ResolvedUser } from '../models/types'

/**
 * JWT 署名鍵。
 * 本番環境では必ず環境変数で上書きすること。
 * CI/CD パイプラインでデフォルト値が本番に流れないことを検証すること。
 */
const JWT_SECRET = process.env.JWT_SECRET ?? 'local-dev-secret-change-in-production'

/**
 * メールアドレスとパスワードで認証し、ResolvedUser を返す。
 *
 * @remarks
 * 現在はインメモリデータとのプレーンテキスト比較。
 * Cognito 移行時はこの関数の実装のみを差し替える。引数・戻り値の型は維持すること。
 *
 * @throws {Error} 認証情報が一致しない場合（message: 'invalid_credentials'）
 */
async function authenticate(email: string, password: string): Promise<ResolvedUser> {
  const user = SEED_USERS.find((u) => u.email === email && u.passwordPlain === password)
  if (!user) throw new Error('invalid_credentials')

  const role = SEED_ROLES.find((r) => r.id === user.roleId)
  if (!role) throw new Error('role_not_found') // データ不整合。起こらないはずだが検出のため throw

  return { sub: user.id, companyId: 'company-root', role: role.code }
}

/**
 * ユーザーIDから JWT（HS256）を発行する。
 *
 * payload は { sub: userId } のみ。Cognito JWT の sub クレームと同形式にすることで、
 * Cognito 移行時にペイロード解析ロジックの変更が不要になる。
 * permissions はペイロードに含めない（毎リクエストで permissionService が解決する）。
 */
function issueJwt(userId: string): string {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: '24h' })
}

/**
 * 認証コンテキストにおけるユーザー取得。
 * Bearer トークンを検証し、対応するユーザーを返す。
 *
 * このメソッドは「認証済みリクエストのアイデンティティ解決」に限定する。
 * 汎用的なユーザー検索（findById, findAll など）はこの service の責務外。
 *
 * @throws {Error} トークンが不正または期限切れ（message: 'invalid_token'）
 * @throws {Error} トークンに対応するユーザーが存在しない（message: 'user_not_found'）
 */
async function getAuthenticatedUser(token: string): Promise<ResolvedUser> {
  let payload: { sub: string }
  try {
    payload = jwt.verify(token, JWT_SECRET) as { sub: string }
  } catch {
    throw new Error('invalid_token')
  }

  const user = SEED_USERS.find((u) => u.id === payload.sub)
  if (!user) throw new Error('user_not_found')

  const role = SEED_ROLES.find((r) => r.id === user.roleId)
  if (!role) throw new Error('role_not_found')

  return { sub: user.id, companyId: 'company-root', role: role.code }
}

export const authService = { authenticate, issueJwt, getAuthenticatedUser }
