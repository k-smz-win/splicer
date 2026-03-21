import type { APIGatewayProxyHandler, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import type { PermissionCode, ResolvedUser } from '../models/types'
import { authService } from '../services/authService'
import { permissionService } from '../services/permissionService'
import { unauthorized, forbidden, internalError, extractBearerToken } from '../utils/response'

type AuthenticatedHandler = (
  event: APIGatewayProxyEvent,
  user: ResolvedUser,
  permissions: PermissionCode[],
) => Promise<APIGatewayProxyResult>

/**
 * トークン検証・権限チェックを共通化したミドルウェア。
 * 各ハンドラーから認証・認可の重複ロジックを排除する。
 *
 * @param requiredPermission - このエンドポイントに必要な権限コード
 * @param handler - 認証済みリクエストを処理する関数
 */
export function withAuth(
  requiredPermission: PermissionCode,
  handler: AuthenticatedHandler,
): APIGatewayProxyHandler {
  return async (event) => {
    try {
      const token = extractBearerToken(event)
      if (!token) return unauthorized('missing_token')

      const user = await authService.getAuthenticatedUser(token)
      const permissions = permissionService.resolve(user.roleId)

      if (!permissions.includes(requiredPermission)) return forbidden()

      return await handler(event, user, permissions)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'internal_error'
      if (message === 'invalid_token' || message === 'user_not_found') return unauthorized(message)
      return internalError(message)
    }
  }
}
