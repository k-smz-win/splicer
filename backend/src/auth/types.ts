import type { APIGatewayProxyEvent } from 'aws-lambda'
import type { ResolvedUser } from '../models/types'

/**
 * 認証サービスのインターフェース。
 * Cognito 実装と Mock 実装の両方がこれを実装する。
 * ビジネスロジックは認証方式に依存しない。
 */
export interface IAuthService {
  /**
   * IDトークンを検証してユーザー情報を返す。
   *
   * @param idToken  - Bearer トークン（Cognito IDトークン or mock）
   * @param event    - Lambda イベント（Mock モードで query/header 上書きに使用）
   * @throws {AuthError} トークンが不正または期限切れ
   */
  resolveUser(idToken: string, event: APIGatewayProxyEvent): Promise<ResolvedUser>
}

/** 認証エラーの基底クラス。HTTP ステータスコードへのマッピングに使う。 */
export class AuthError extends Error {
  constructor(
    message: string,
    public readonly statusCode: 401 | 403 = 401,
  ) {
    super(message)
    this.name = 'AuthError'
  }
}
