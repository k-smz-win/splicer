import type { APIGatewayProxyHandler } from 'aws-lambda'
import { resolveAuthenticatedUser, AuthError } from '../auth'
import { permissionService } from '../services/permissionService'
import { settingsService } from '../services/settingsService'
import type { SettingValue } from '../repositories/ISettingsRepository'
import { ok, badRequest, unauthorized, forbidden, internalError } from '../utils/response'

function handleError(err: unknown) {
  if (err instanceof AuthError) {
    return err.statusCode === 403 ? forbidden(err.message) : unauthorized(err.message)
  }
  const message = err instanceof Error ? err.message : 'internal_error'
  if (message === 'forbidden')    return forbidden()
  if (message === 'invalid_role') return badRequest('invalid_role: must be MANAGER, USER, or WORKER')
  if (message === 'invalid_key')  return badRequest('invalid_key')
  return internalError(message)
}

// =========================================
// 会社設定
// =========================================

/**
 * GET /api/companies/{id}/settings
 *
 * 会社の全ロール×全キーの設定を返す。
 * 未設定のキーはシステムデフォルト値で補完される。
 *
 * 権限: MANAGE_COMPANY（SYS_ADMINのみ）
 */
export const getCompanySettings: APIGatewayProxyHandler = async (event) => {
  try {
    const user = await resolveAuthenticatedUser(event)
    const permissions = permissionService.resolve(user.role)
    if (!permissions.includes('MANAGE_COMPANY')) return forbidden()

    const companyId = event.pathParameters?.['id']
    if (!companyId) return badRequest('missing_id')

    const settings = await settingsService.getCompanySettings(companyId, user)
    return ok({ companyId, settings })
  } catch (err) {
    return handleError(err)
  }
}

/**
 * PUT /api/companies/{id}/settings/{role}/{key}
 *
 * 特定ロール・キーの設定を更新する（upsert）。
 *
 * 権限: MANAGE_COMPANY（SYS_ADMINのみ）
 *
 * body: { "value": true | false | number | string }
 */
export const setCompanySetting: APIGatewayProxyHandler = async (event) => {
  try {
    const user = await resolveAuthenticatedUser(event)
    const permissions = permissionService.resolve(user.role)
    if (!permissions.includes('MANAGE_COMPANY')) return forbidden()

    const companyId = event.pathParameters?.['id']
    const role      = event.pathParameters?.['role']
    const key       = event.pathParameters?.['key']

    if (!companyId || !role || !key) return badRequest('missing_path_parameters')

    const body = JSON.parse(event.body ?? '{}') as { value?: unknown }
    if (body.value === undefined) return badRequest('missing_value')
    if (
      typeof body.value !== 'boolean' &&
      typeof body.value !== 'number' &&
      typeof body.value !== 'string'
    ) {
      return badRequest('value must be boolean, number, or string')
    }

    const result = await settingsService.setCompanySetting(
      companyId,
      role,
      key,
      body.value as SettingValue,
      user,
    )
    return ok(result)
  } catch (err) {
    return handleError(err)
  }
}

// =========================================
// ユーザー個別設定
// =========================================

/**
 * GET /api/users/{sub}/settings
 *
 * ユーザーの設定を返す。
 * user_settings → company_settings → デフォルトの優先順で解決済みの値を返す。
 *
 * 権限: 本人 or MANAGE_COMPANY（SYS_ADMIN）
 */
export const getUserSettings: APIGatewayProxyHandler = async (event) => {
  try {
    const actor = await resolveAuthenticatedUser(event)

    const sub = event.pathParameters?.['sub']
    if (!sub) return badRequest('missing_sub')

    const settings = await settingsService.getUserSettings(
      sub,
      actor.companyId,
      actor.role,
      actor,
    )
    return ok({ sub, settings })
  } catch (err) {
    return handleError(err)
  }
}

/**
 * PUT /api/users/{sub}/settings/{key}
 *
 * ユーザー個別設定を更新する（upsert）。
 * 設定後は company_settings より優先して適用される。
 *
 * 権限: 本人 or MANAGE_COMPANY（SYS_ADMIN）
 *
 * body: { "value": true | false | number | string }
 */
export const setUserSetting: APIGatewayProxyHandler = async (event) => {
  try {
    const actor = await resolveAuthenticatedUser(event)

    const sub = event.pathParameters?.['sub']
    const key = event.pathParameters?.['key']
    if (!sub || !key) return badRequest('missing_path_parameters')

    const body = JSON.parse(event.body ?? '{}') as { value?: unknown }
    if (body.value === undefined) return badRequest('missing_value')
    if (
      typeof body.value !== 'boolean' &&
      typeof body.value !== 'number' &&
      typeof body.value !== 'string'
    ) {
      return badRequest('value must be boolean, number, or string')
    }

    await settingsService.setUserSetting(sub, key, body.value as SettingValue, actor)
    return ok({ sub, key, value: body.value })
  } catch (err) {
    return handleError(err)
  }
}

/**
 * DELETE /api/users/{sub}/settings/{key}
 *
 * ユーザー個別設定を削除し、会社設定に戻す。
 *
 * 権限: 本人 or MANAGE_COMPANY（SYS_ADMIN）
 */
export const deleteUserSetting: APIGatewayProxyHandler = async (event) => {
  try {
    const actor = await resolveAuthenticatedUser(event)

    const sub = event.pathParameters?.['sub']
    const key = event.pathParameters?.['key']
    if (!sub || !key) return badRequest('missing_path_parameters')

    await settingsService.deleteUserSetting(sub, key, actor)
    return ok({ message: 'deleted' })
  } catch (err) {
    return handleError(err)
  }
}
