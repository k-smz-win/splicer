import type { APIGatewayProxyHandler } from 'aws-lambda'
import { fusionService } from '../services/fusionService'
import { resolveAuthenticatedUser, AuthError } from '../auth'
import { permissionService } from '../services/permissionService'
import { ok, unauthorized, forbidden, internalError } from '../utils/response'

/**
 * GET /api/fusion
 *
 * VIEW_FUSION 権限を要求する。
 * クエリパラメータ projectId で絞り込み可能。
 * 日時はすべて UTC ISO 8601 で返す。ローカル変換はフロントの utils/date.ts が担う。
 */
export const getFusion: APIGatewayProxyHandler = async (event) => {
  try {
    const user = await resolveAuthenticatedUser(event)
    const permissions = permissionService.resolve(user.role)
    if (!permissions.includes('VIEW_FUSION')) return forbidden()

    const projectId = event.queryStringParameters?.projectId ?? undefined
    return ok(fusionService.list(projectId))
  } catch (err) {
    if (err instanceof AuthError) {
      return err.statusCode === 403 ? forbidden(err.message) : unauthorized(err.message)
    }
    return internalError(err instanceof Error ? err.message : 'internal_error')
  }
}
