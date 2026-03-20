import type { APIGatewayProxyHandler } from 'aws-lambda'
import { authService } from '../services/authService'
import { permissionService } from '../services/permissionService'
import { fusionService } from '../services/fusionService'
import { ok, unauthorized, forbidden, internalError, extractBearerToken } from '../utils/response'

/**
 * GET /api/fusion
 *
 * VIEW_FUSION 権限を要求する。
 * クエリパラメータ projectId で絞り込み可能。
 * 日時はすべて UTC ISO 8601 で返す。ローカル変換はフロントの utils/date.ts が担う。
 */
export const getFusion: APIGatewayProxyHandler = async (event) => {
  try {
    const token = extractBearerToken(event)
    if (!token) return unauthorized('missing_token')

    const user = await authService.getAuthenticatedUser(token)
    const permissions = permissionService.resolve(user.roleId)

    if (!permissions.includes('VIEW_FUSION')) return forbidden()

    const projectId = event.queryStringParameters?.projectId ?? undefined
    return ok(fusionService.list(projectId))
  } catch (err) {
    const message = err instanceof Error ? err.message : 'internal_error'
    if (message === 'invalid_token' || message === 'user_not_found') return unauthorized(message)
    return internalError(message)
  }
}
