import type { APIGatewayProxyEvent } from 'aws-lambda'
import type { RoleCode, ResolvedUser } from '../models/types'
import { AuthError, type IAuthService } from './types'

/**
 * デモ / ローカル開発用 Mock 認証サービス。
 *
 * - JWT検証を行わない。任意のトークン文字列を受け入れる（空でなければ通過）
 * - デフォルトユーザーは SEED_MOCK_USER で定義
 * - query parameter または Authorization ヘッダーで role / companyId を上書き可能
 *
 * 上書き方法:
 *   ?mockRole=MANAGER&mockCompanyId=company-002
 *   X-Mock-Role: MANAGER
 *   X-Mock-Company-Id: company-002
 *
 * ⚠️  本番環境での使用禁止。createAuthService() で NODE_ENV チェック済み。
 */

const VALID_ROLES: RoleCode[] = ['SYS_ADMIN', 'MANAGER', 'USER', 'WORKER']

function isRoleCode(value: unknown): value is RoleCode {
  return typeof value === 'string' && (VALID_ROLES as string[]).includes(value)
}

/** デフォルトユーザー。ルート会社（ADMIN）に所属する SYS_ADMIN。 */
const SEED_MOCK_USER: ResolvedUser = {
  sub: 'mock-user-001',
  companyId: 'company-root',
  role: 'SYS_ADMIN',
}

export class MockAuthService implements IAuthService {
  async resolveUser(idToken: string, event: APIGatewayProxyEvent): Promise<ResolvedUser> {
    if (!idToken) throw new AuthError('missing_token')

    // query parameter 優先、次に header で上書き
    const mockRole =
      event.queryStringParameters?.['mockRole'] ??
      event.headers?.['x-mock-role'] ??
      event.headers?.['X-Mock-Role']

    const mockCompanyId =
      event.queryStringParameters?.['mockCompanyId'] ??
      event.headers?.['x-mock-company-id'] ??
      event.headers?.['X-Mock-Company-Id']

    const role = isRoleCode(mockRole) ? mockRole : SEED_MOCK_USER.role
    const companyId = (typeof mockCompanyId === 'string' && mockCompanyId)
      ? mockCompanyId
      : SEED_MOCK_USER.companyId

    return { sub: SEED_MOCK_USER.sub, companyId, role }
  }
}
