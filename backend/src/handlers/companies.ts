import type { APIGatewayProxyHandler } from 'aws-lambda'
import { resolveAuthenticatedUser, AuthError } from '../auth'
import { permissionService } from '../services/permissionService'
import { companyService } from '../services/companyService'
import { ok, badRequest, unauthorized, forbidden, notFound, internalError } from '../utils/response'
import type { CompanyType } from '../models/types'

/** 認証エラーを HTTP レスポンスに変換する共通ヘルパー。 */
function handleError(err: unknown) {
  if (err instanceof AuthError) {
    return err.statusCode === 403 ? forbidden(err.message) : unauthorized(err.message)
  }
  const message = err instanceof Error ? err.message : 'internal_error'
  if (message === 'forbidden')       return forbidden()
  if (message === 'not_found')       return notFound()
  if (message === 'parent_not_found') return notFound('parent_not_found')
  return internalError(message)
}

const VALID_TYPES: CompanyType[] = ['ADMIN', 'SALES', 'AGENCY', 'CUSTOMER']

/**
 * POST /api/companies
 *
 * 会社を新規作成する。
 * 権限チェック: MANAGE_COMPANY
 * 会社スコープ: SYS_ADMIN は任意、それ以外は自社配下にのみ作成可能
 */
export const createCompany: APIGatewayProxyHandler = async (event) => {
  try {
    const user = await resolveAuthenticatedUser(event)
    const permissions = permissionService.resolve(user.role)

    if (!permissions.includes('MANAGE_COMPANY')) return forbidden()

    const body = JSON.parse(event.body ?? '{}') as {
      name?: string
      type?: string
      parentId?: string | null
    }

    if (!body.name || typeof body.name !== 'string') {
      return badRequest('missing_name')
    }
    if (!body.type || !(VALID_TYPES as string[]).includes(body.type)) {
      return badRequest(`invalid_type. must be one of: ${VALID_TYPES.join(', ')}`)
    }

    const company = await companyService.createCompany(
      {
        name: body.name,
        type: body.type as CompanyType,
        parentId: body.parentId ?? null,
      },
      user,
    )

    return ok(company)
  } catch (err) {
    return handleError(err)
  }
}

/**
 * GET /api/companies/{id}/descendants
 *
 * 指定会社の配下（子孫）一覧を返す。
 * 権限チェック: MANAGE_COMPANY、かつ自社の配下のみ参照可
 */
export const getDescendants: APIGatewayProxyHandler = async (event) => {
  try {
    const user = await resolveAuthenticatedUser(event)
    const permissions = permissionService.resolve(user.role)

    if (!permissions.includes('MANAGE_COMPANY')) return forbidden()

    const companyId = event.pathParameters?.['id']
    if (!companyId) return badRequest('missing_id')

    const descendants = await companyService.getDescendants(companyId, user)
    return ok(descendants)
  } catch (err) {
    return handleError(err)
  }
}

/**
 * GET /api/companies/{id}/ancestors
 *
 * 指定会社の祖先（親・親の親...）一覧を返す。
 * 権限チェック: MANAGE_COMPANY、かつ自社の配下のみ参照可
 */
export const getAncestors: APIGatewayProxyHandler = async (event) => {
  try {
    const user = await resolveAuthenticatedUser(event)
    const permissions = permissionService.resolve(user.role)

    if (!permissions.includes('MANAGE_COMPANY')) return forbidden()

    const companyId = event.pathParameters?.['id']
    if (!companyId) return badRequest('missing_id')

    const ancestors = await companyService.getAncestors(companyId, user)
    return ok(ancestors)
  } catch (err) {
    return handleError(err)
  }
}

/**
 * GET /api/companies/me/descendants
 *
 * ログインユーザーの会社配下を返す。
 * pathParameter を使わず actor.companyId を直接使用する。
 *
 * ⚠️ serverless.ts で /companies/me/descendants を /companies/{id}/descendants より
 *    先に定義すること（同一パターンの衝突を避けるため）。
 */
export const getMyDescendants: APIGatewayProxyHandler = async (event) => {
  try {
    const user = await resolveAuthenticatedUser(event)
    const descendants = await companyService.getMyDescendants(user)
    return ok(descendants)
  } catch (err) {
    return handleError(err)
  }
}
