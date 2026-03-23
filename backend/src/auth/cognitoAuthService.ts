import { CognitoJwtVerifier } from 'aws-jwt-verify'
import type { APIGatewayProxyEvent } from 'aws-lambda'
import type { RoleCode, ResolvedUser } from '../models/types'
import { AuthError, type IAuthService } from './types'

const VALID_ROLES: RoleCode[] = ['SYS_ADMIN', 'MANAGER', 'USER', 'WORKER']

function isRoleCode(value: unknown): value is RoleCode {
  return typeof value === 'string' && (VALID_ROLES as string[]).includes(value)
}

/**
 * Cognito IDトークン検証サービス。
 *
 * - tokenUse: 'id' を指定することで custom:* 属性が取得可能になる
 * - アクセストークンでは custom:company_id / custom:role は取得できないため使用しない
 *
 * 環境変数:
 *   COGNITO_USER_POOL_ID  : Cognito ユーザープール ID
 *   COGNITO_CLIENT_ID     : Cognito アプリクライアント ID
 */
export class CognitoAuthService implements IAuthService {
  private readonly verifier

  constructor() {
    const userPoolId = process.env.COGNITO_USER_POOL_ID
    const clientId = process.env.COGNITO_CLIENT_ID

    if (!userPoolId || !clientId) {
      throw new Error('COGNITO_USER_POOL_ID and COGNITO_CLIENT_ID must be set')
    }

    this.verifier = CognitoJwtVerifier.create({
      userPoolId,
      clientId,
      tokenUse: 'id',  // IDトークン必須。custom:* 属性はここにのみ含まれる
    })
  }

  async resolveUser(idToken: string, _event: APIGatewayProxyEvent): Promise<ResolvedUser> {
    let payload: Record<string, unknown>
    try {
      payload = await this.verifier.verify(idToken) as Record<string, unknown>
    } catch {
      throw new AuthError('invalid_token')
    }

    const sub = payload['sub']
    const companyId = payload['custom:company_id']
    const roleRaw = payload['custom:role']

    if (typeof sub !== 'string' || !sub) {
      throw new AuthError('invalid_token')
    }
    if (typeof companyId !== 'string' || !companyId) {
      throw new AuthError('missing_company_id')
    }
    if (!isRoleCode(roleRaw)) {
      throw new AuthError('invalid_role')
    }

    return { sub, companyId, role: roleRaw }
  }
}
