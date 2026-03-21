import type { APIGatewayProxyHandler } from 'aws-lambda'
import { authService } from '../services/authService'
import { permissionService } from '../services/permissionService'
import { ok, badRequest, unauthorized, internalError } from '../utils/response'
import { withToken } from '../middleware/withToken'

/**
 * POST /api/auth/login
 *
 * メールアドレス・パスワードで認証し、JWT とユーザー情報・解決済み権限を返す。
 * フロントは受け取った permissions[] をそのまま保持し、ロールには依存しない。
 *
 * @remarks
 * 認証ロジックは authService.authenticate() に委譲する。
 * Cognito 移行時は authService 内部のみを差し替える。このハンドラーは変更不要。
 */
export const login: APIGatewayProxyHandler = async (event) => {
  try {
    const body = JSON.parse(event.body ?? '{}') as { email?: string; password?: string }
    if (!body.email || !body.password) return badRequest('missing_credentials')

    const user = await authService.authenticate(body.email, body.password)
    const token = authService.issueJwt(user.id)
    const permissions = permissionService.resolve(user.roleId)

    return ok({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      permissions,
      token,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'internal_error'
    if (message === 'invalid_credentials') return unauthorized(message)
    return internalError(message)
  }
}

/**
 * GET /api/auth/me
 *
 * Bearer トークンから認証済みユーザー情報と解決済み権限を返す。
 * セッション復元・ページリロード時にフロントが呼び出す。
 */
export const me = withToken(async (_event, user, permissions) => {
  return ok({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    permissions,
  })
})
