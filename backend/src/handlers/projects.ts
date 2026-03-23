import type { APIGatewayProxyHandler } from 'aws-lambda'
import { projectService } from '../services/projectService'
import { resolveAuthenticatedUser, AuthError } from '../auth'
import { permissionService } from '../services/permissionService'
import { ok, unauthorized, forbidden, internalError } from '../utils/response'

/**
 * GET /api/projects
 *
 * MANAGE_PROJECT 権限を要求する。
 */
export const getProjects: APIGatewayProxyHandler = async (event) => {
  try {
    const user = await resolveAuthenticatedUser(event)
    const permissions = permissionService.resolve(user.role)
    if (!permissions.includes('MANAGE_PROJECT')) return forbidden()

    return ok(projectService.list())
  } catch (err) {
    if (err instanceof AuthError) {
      return err.statusCode === 403 ? forbidden(err.message) : unauthorized(err.message)
    }
    return internalError(err instanceof Error ? err.message : 'internal_error')
  }
}
