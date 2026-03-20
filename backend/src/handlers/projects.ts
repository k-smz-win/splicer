import type { APIGatewayProxyHandler } from 'aws-lambda'
import { authService } from '../services/authService'
import { permissionService } from '../services/permissionService'
import { projectService } from '../services/projectService'
import { ok, unauthorized, forbidden, internalError, extractBearerToken } from '../utils/response'

/**
 * GET /api/projects
 *
 * MANAGE_PROJECT 権限を要求する。
 */
export const getProjects: APIGatewayProxyHandler = async (event) => {
  try {
    const token = extractBearerToken(event)
    if (!token) return unauthorized('missing_token')

    const user = await authService.getAuthenticatedUser(token)
    const permissions = permissionService.resolve(user.roleId)

    if (!permissions.includes('MANAGE_PROJECT')) return forbidden()

    return ok(projectService.list())
  } catch (err) {
    const message = err instanceof Error ? err.message : 'internal_error'
    if (message === 'invalid_token' || message === 'user_not_found') return unauthorized(message)
    return internalError(message)
  }
}
