import type { APIGatewayProxyHandler, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import type { PermissionCode, ResolvedUser } from '../models/types'
import { authService } from '../services/authService'
import { permissionService } from '../services/permissionService'
import { unauthorized, forbidden, handleAuthError, extractBearerToken } from '../utils/response'

type AuthenticatedHandler = (
  event: APIGatewayProxyEvent,
  user: ResolvedUser,
  permissions: PermissionCode[],
) => Promise<APIGatewayProxyResult>

/**
 * @deprecated
 * このミドルウェアは廃止予定。新しいハンドラーは使用しないこと。
 * auth/index.ts の resolveAuthenticatedUser() を handler 内で直接呼び出すこと。
 *
 * 移行例:
 *   // After（関数方式）
 *   export const handler: APIGatewayProxyHandler = async (event) => {
 *     const user = await resolveAuthenticatedUser(event)
 *     const permissions = permissionService.resolve(user.role)
 *     if (!permissions.includes('MANAGE_PROJECT')) return forbidden()
 *     ...
 *   }
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
      const permissions = permissionService.resolve(user.role)

      if (!permissions.includes(requiredPermission)) return forbidden()

      return await handler(event, user, permissions)
    } catch (err) {
      return handleAuthError(err)
    }
  }
}
