import type { APIGatewayProxyHandler } from 'aws-lambda'
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  RespondToAuthChallengeCommand,
  AssociateSoftwareTokenCommand,
  VerifySoftwareTokenCommand,
} from '@aws-sdk/client-cognito-identity-provider'
import { resolveAuthenticatedUser, AuthError } from '../auth'
import { permissionService } from '../services/permissionService'
import { ok, badRequest, unauthorized, forbidden, internalError } from '../utils/response'
import type { RoleCode } from '../models/types'

// =========================================
// Cognito クライアント
// =========================================

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION ?? 'ap-northeast-1',
})

const CLIENT_ID = process.env.COGNITO_CLIENT_ID ?? ''

// =========================================
// エラーハンドリング
// =========================================

function handleError(err: unknown) {
  if (err instanceof AuthError) {
    return err.statusCode === 403 ? forbidden(err.message) : unauthorized(err.message)
  }
  const message = err instanceof Error ? err.message : 'internal_error'
  if (message === 'invalid_token' || message === 'missing_token') return unauthorized(message)
  return internalError(message)
}

/** Cognito SDK エラーを HTTP レスポンスにマッピングする。 */
function handleCognitoError(err: unknown) {
  const name = (err as { name?: string }).name ?? ''
  const message = (err as { message?: string }).message ?? 'internal_error'

  if (name === 'NotAuthorizedException')          return unauthorized('invalid_credentials')
  if (name === 'UserNotFoundException')           return unauthorized('user_not_found')
  if (name === 'CodeMismatchException')           return badRequest('invalid_totp_code')
  if (name === 'EnableSoftwareTokenMFAException') return badRequest('mfa_setup_failed')
  if (name === 'UserNotConfirmedException')       return unauthorized('user_not_confirmed')

  console.error('[AUTH] Cognito error:', name, message)
  return internalError('auth_error')
}

// =========================================
// POST /api/auth/login
// =========================================

/**
 * ログイン。メール + パスワードで認証を開始する。
 *
 * MFA フロー（Cognito チャレンジ/レスポンス）:
 *   初回（MFA未設定）→ { challenge: 'MFA_SETUP', session }
 *   MFA設定済み      → { challenge: 'SOFTWARE_TOKEN_MFA', session }
 *   MFA不要          → { idToken, user, permissions }
 *
 * クライアントは challenge を見て次のエンドポイントを選択する:
 *   MFA_SETUP          → POST /auth/mfa/setup
 *   SOFTWARE_TOKEN_MFA → POST /auth/mfa/challenge
 */
export const login: APIGatewayProxyHandler = async (event) => {
  try {
    const body = JSON.parse(event.body ?? '{}') as { email?: string; password?: string }
    if (!body.email || !body.password) return badRequest('missing_credentials')

    const result = await cognitoClient.send(new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: CLIENT_ID,
      AuthParameters: {
        USERNAME: body.email,
        PASSWORD: body.password,
      },
    }))

    if (result.ChallengeName === 'SOFTWARE_TOKEN_MFA') {
      return ok({ challenge: 'SOFTWARE_TOKEN_MFA', session: result.Session })
    }
    if (result.ChallengeName === 'MFA_SETUP') {
      return ok({ challenge: 'MFA_SETUP', session: result.Session })
    }

    const idToken = result.AuthenticationResult?.IdToken
    if (!idToken) return internalError('no_id_token')

    return ok(buildLoginResponse(idToken))
  } catch (err) {
    return handleCognitoError(err)
  }
}

// =========================================
// POST /api/auth/mfa/challenge
// =========================================

/**
 * MFA チャレンジへの応答。
 * ログイン後に SOFTWARE_TOKEN_MFA チャレンジが返ってきた場合に使う。
 *
 * body: { email, session, code }
 * response: { idToken, user, permissions }
 */
export const mfaChallenge: APIGatewayProxyHandler = async (event) => {
  try {
    const body = JSON.parse(event.body ?? '{}') as {
      email?: string; session?: string; code?: string
    }
    if (!body.email || !body.session || !body.code) {
      return badRequest('missing_fields: email, session, code required')
    }

    const result = await cognitoClient.send(new RespondToAuthChallengeCommand({
      ClientId: CLIENT_ID,
      ChallengeName: 'SOFTWARE_TOKEN_MFA',
      Session: body.session,
      ChallengeResponses: {
        USERNAME: body.email,
        SOFTWARE_TOKEN_MFA_CODE: body.code,
      },
    }))

    const idToken = result.AuthenticationResult?.IdToken
    if (!idToken) return internalError('no_id_token')

    return ok(buildLoginResponse(idToken))
  } catch (err) {
    return handleCognitoError(err)
  }
}

// =========================================
// POST /api/auth/mfa/setup
// =========================================

/**
 * TOTP MFA 初回設定 Step1: シークレットキーを取得する。
 *
 * ログイン時に MFA_SETUP チャレンジが返ってきた場合に使う。
 * レスポンスの secretCode を使ってクライアントで QR コードを生成する。
 *
 * QR コード URI 形式:
 *   otpauth://totp/{label}?secret={secretCode}&issuer={issuer}
 *
 * body: { session }
 * response: { secretCode, session }
 */
export const mfaSetup: APIGatewayProxyHandler = async (event) => {
  try {
    const body = JSON.parse(event.body ?? '{}') as { session?: string }
    if (!body.session) return badRequest('missing_session')

    const result = await cognitoClient.send(new AssociateSoftwareTokenCommand({
      Session: body.session,
    }))

    if (!result.SecretCode || !result.Session) {
      return internalError('associate_software_token_failed')
    }

    return ok({ secretCode: result.SecretCode, session: result.Session })
  } catch (err) {
    return handleCognitoError(err)
  }
}

// =========================================
// POST /api/auth/mfa/verify-setup
// =========================================

/**
 * TOTP MFA 初回設定 Step2: コード検証 → セットアップ完了 → トークン取得。
 *
 * mfaSetup で取得した secretCode で生成した TOTP コードを送信する。
 * 検証成功後、MFA_SETUP チャレンジへの応答としてトークンを取得する。
 *
 * body: { email, session, code }
 * response: { idToken, user, permissions }
 */
export const mfaVerifySetup: APIGatewayProxyHandler = async (event) => {
  try {
    const body = JSON.parse(event.body ?? '{}') as {
      email?: string; session?: string; code?: string
    }
    if (!body.email || !body.session || !body.code) {
      return badRequest('missing_fields: email, session, code required')
    }

    // Step A: TOTP コードを検証してセットアップ完了
    const verifyResult = await cognitoClient.send(new VerifySoftwareTokenCommand({
      Session: body.session,
      UserCode: body.code,
    }))

    if (verifyResult.Status !== 'SUCCESS' || !verifyResult.Session) {
      return badRequest('invalid_totp_code')
    }

    // Step B: MFA_SETUP チャレンジに応答してトークンを取得
    const result = await cognitoClient.send(new RespondToAuthChallengeCommand({
      ClientId: CLIENT_ID,
      ChallengeName: 'MFA_SETUP',
      Session: verifyResult.Session,
      ChallengeResponses: { USERNAME: body.email },
    }))

    const idToken = result.AuthenticationResult?.IdToken
    if (!idToken) return internalError('no_id_token')

    return ok(buildLoginResponse(idToken))
  } catch (err) {
    return handleCognitoError(err)
  }
}

// =========================================
// GET /api/auth/me
// =========================================

/**
 * Bearer IDトークンからログインユーザーの情報を返す。
 * セッション復元・ページリロード時にフロントが呼び出す。
 */
export const me: APIGatewayProxyHandler = async (event) => {
  try {
    const user = await resolveAuthenticatedUser(event)
    const permissions = permissionService.resolve(user.role)
    return ok({ user, permissions })
  } catch (err) {
    return handleError(err)
  }
}

// =========================================
// 内部ヘルパー
// =========================================

/**
 * IDトークンのペイロードをデコードしてレスポンスを構築する。
 *
 * @remarks
 * ここは Cognito SDK から直接受け取ったトークン（ログイン直後）を処理する。
 * me エンドポイントのような「リクエストで受け取るトークン」の検証は
 * auth/cognitoAuthService.ts（aws-jwt-verify）で行う。
 */
function buildLoginResponse(idToken: string) {
  const [, payloadB64] = idToken.split('.')
  const payload = JSON.parse(
    Buffer.from(payloadB64, 'base64url').toString('utf-8'),
  ) as Record<string, unknown>

  const sub       = payload['sub'] as string
  const companyId = (payload['custom:company_id'] as string | undefined) ?? ''
  const role      = (payload['custom:role'] as RoleCode | undefined) ?? 'USER'

  const user = { sub, companyId, role }
  const permissions = permissionService.resolve(role)

  return { idToken, user, permissions }
}
