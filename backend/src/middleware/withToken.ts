import type { APIGatewayProxyHandler, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import type { PermissionCode, ResolvedUser } from '../models/types'
import { authService } from '../services/authService'
import { permissionService } from '../services/permissionService'
import { unauthorized, handleAuthError, extractBearerToken } from '../utils/response'

type AuthenticatedHandler = (
  event: APIGatewayProxyEvent,
  user: ResolvedUser,
  permissions: PermissionCode[],
) => Promise<APIGatewayProxyResult>

/**
 * トークン検証のみを行うミドルウェア。権限チェックは行わない。
 * /api/auth/me のように認証は必要だが特定権限を要求しないエンドポイントに使う。
 * 権限チェックが必要な場合は withAuth を使うこと。
 */
export function withToken(handler: AuthenticatedHandler): APIGatewayProxyHandler {
  return async (event) => {
    try {
      const token = extractBearerToken(event)
      if (!token) return unauthorized('missing_token')

      const user = await authService.getAuthenticatedUser(token)
      const permissions = permissionService.resolve(user.roleId)

      return await handler(event, user, permissions)
    } catch (err) {
      return handleAuthError(err)
    }
  }
}
