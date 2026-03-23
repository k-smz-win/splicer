import type { APIGatewayProxyEvent } from 'aws-lambda'
import type { ResolvedUser } from '../models/types'
import { AuthError, type IAuthService } from './types'
import { CognitoAuthService } from './cognitoAuthService'
import { MockAuthService } from './mockAuthService'
import { extractBearerToken } from '../utils/response'

export { AuthError } from './types'

/**
 * 環境変数 AUTH_MODE に応じて認証サービスを生成するファクトリ。
 *
 * AUTH_MODE=cognito（デフォルト）: Cognito IDトークン検証
 * AUTH_MODE=mock               : デモ用 Mock 認証
 *
 * ⚠️  本番環境（NODE_ENV=production）で mock は起動不可。
 */
function createAuthService(): IAuthService {
  const mode = process.env.AUTH_MODE ?? 'cognito'

  if (mode === 'mock') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('[FATAL] AUTH_MODE=mock is not allowed in production (NODE_ENV=production)')
    }
    console.warn('[AUTH] Running in MOCK mode. Never use this in production.')
    return new MockAuthService()
  }

  return new CognitoAuthService()
}

const authService: IAuthService = createAuthService()

/**
 * Lambda ハンドラーから呼び出す認証関数。
 * Bearer トークンを抽出・検証し、ResolvedUser を返す。
 *
 * 使い方（handler 内で直接呼ぶ。middleware は使わない）:
 * ```ts
 * export const myHandler: APIGatewayProxyHandler = async (event) => {
 *   const user = await resolveAuthenticatedUser(event)
 *   // ...
 * }
 * ```
 *
 * @throws {AuthError} トークンが存在しない・不正・期限切れの場合
 */
export async function resolveAuthenticatedUser(event: APIGatewayProxyEvent): Promise<ResolvedUser> {
  const token = extractBearerToken(event)
  if (!token) throw new AuthError('missing_token')
  return authService.resolveUser(token, event)
}
